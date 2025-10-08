import { NextRequest, NextResponse } from 'next/server';
import { getSourcedProductModel } from '@/models/SourcedProduct';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await requirePermission(PERMISSIONS.PRODUCT_CREATE)(request);

        // No limit - process all products

        // Get all sourced products, prioritizing those that haven't been refreshed recently
        const Sourced = await getSourcedProductModel();

        // Get total count first
        const totalCount = await Sourced.countDocuments({});
        console.log(`Total sourced products in database: ${totalCount}`);

        // Get ALL sourced products, prioritizing those that haven't been refreshed recently
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let sourcedProducts = await Sourced.find({
            $or: [
                { updatedAt: { $lt: oneDayAgo } }, // Not refreshed in last 24 hours
                { updatedAt: { $exists: false } }   // Never been updated
            ]
        })
            .sort({ updatedAt: 1 }) // Start with oldest updated first
            .lean();

        console.log(`Found ${sourcedProducts.length} products that need refreshing (out of ${totalCount} total)`);

        // If no products need refreshing, get ALL products
        if (sourcedProducts.length === 0) {
            sourcedProducts = await Sourced.find({})
                .sort({ updatedAt: 1 })
                .lean();
            console.log(`No products need refreshing, getting ALL ${sourcedProducts.length} products instead`);
        }

        // Process ALL products - no limit applied
        console.log(`Processing ALL ${sourcedProducts.length} products`);

        if (sourcedProducts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No sourced products found to refresh',
                results: { total: 0, refreshed: 0, errors: 0 }
            });
        }

        const results = [];
        const errors = [];
        let refreshed = 0;

        console.log(`🚀 Starting bulk refresh for ALL ${sourcedProducts.length} sourced products`);
        console.log(`⏱️  Estimated time: ${Math.ceil(sourcedProducts.length / 60)} minutes`);

        // Process each sourced product
        for (let i = 0; i < sourcedProducts.length; i++) {
            const sourcedProduct = sourcedProducts[i];

            try {
                console.log(`\n=== Refreshing ${i + 1}/${sourcedProducts.length} ===`);
                console.log(`Product: ${sourcedProduct.title}`);
                console.log(`Source URL: ${sourcedProduct.sourceUrl}`);
                console.log(`Last Updated: ${sourcedProduct.updatedAt || 'Never'}`);

                // Re-scrape the product data
                const importResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sourcing/import-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: sourcedProduct.sourceUrl,
                        alsoCreateDraftProduct: false
                    })
                });

                if (!importResponse.ok) {
                    const errorData = await importResponse.json();
                    throw new Error(errorData.error || 'Import failed');
                }

                const importData = await importResponse.json();
                const parsed = importData.parsed || {};

                // Update the sourced product with fresh data - use fresh data if available, otherwise keep existing
                const updateData = {
                    title: parsed.title || sourcedProduct.title,
                    price: typeof parsed.price === 'number' ? parsed.price : sourcedProduct.price,
                    description: parsed.description || sourcedProduct.description,
                    images: Array.isArray(parsed.images) && parsed.images.length > 0 ? parsed.images : sourcedProduct.images,
                    specs: parsed.specs || sourcedProduct.specs,
                };

                console.log(`Fresh data received:`, {
                    title: parsed.title,
                    price: parsed.price,
                    description: parsed.description ? parsed.description.substring(0, 100) + '...' : 'None',
                    images: parsed.images ? `${parsed.images.length} images` : 'None',
                    specs: parsed.specs ? Object.keys(parsed.specs).length + ' specs' : 'None'
                });

                // Check what fields actually changed
                const changedFields = Object.keys(updateData).filter(key =>
                    updateData[key] !== sourcedProduct[key]
                );

                console.log(`Changed fields: ${changedFields.length > 0 ? changedFields.join(', ') : 'None'}`);

                const updateResult = await Sourced.updateOne(
                    { _id: sourcedProduct._id },
                    { $set: { ...updateData, updatedAt: new Date() } }
                );

                console.log(`Database update result:`, {
                    matched: updateResult.matchedCount,
                    modified: updateResult.modifiedCount
                });

                // Verify the update was successful by fetching the updated record
                const updatedRecord = await Sourced.findById(sourcedProduct._id).lean();
                console.log(`Verification - Updated record:`, {
                    title: updatedRecord?.title,
                    price: updatedRecord?.price,
                    description: updatedRecord?.description ? updatedRecord.description.substring(0, 50) + '...' : 'None',
                    images: updatedRecord?.images ? `${updatedRecord.images.length} images` : 'None',
                    updatedAt: updatedRecord?.updatedAt
                });

                refreshed++;
                results.push({
                    id: sourcedProduct._id.toString(),
                    title: sourcedProduct.title,
                    sourceUrl: sourcedProduct.sourceUrl,
                    status: 'refreshed',
                    updatedFields: changedFields,
                    lastUpdated: sourcedProduct.updatedAt,
                    newUpdated: new Date()
                });

                console.log(`✅ Successfully refreshed: ${sourcedProduct.title} (${changedFields.length} fields changed)`);

                // Removed delay to allow immediate next processing

            } catch (error: any) {
                console.error(`❌ Error refreshing ${sourcedProduct.title}:`, error);
                errors.push({
                    id: sourcedProduct._id.toString(),
                    title: sourcedProduct.title,
                    sourceUrl: sourcedProduct.sourceUrl,
                    error: error.message || 'Unknown error'
                });
            }
        }

        // Audit log for bulk refresh operation
        try {
            const ip = request.headers.get('x-forwarded-for') || request.ip || '';
            const userAgent = request.headers.get('user-agent') || '';
            await AuditLog.create({
                userId: user.userId,
                action: 'sourced:bulk_refresh',
                resourceType: 'SourcedProduct',
                resourceId: sourcedProducts.map(p => p._id.toString()).join(','),
                metadata: {
                    totalRequested: sourcedProducts.length,
                    totalRefreshed: refreshed,
                    totalErrors: errors.length,
                    refreshedProducts: results.map(r => ({ id: r.id, title: r.title }))
                },
                ip,
                userAgent,
            });
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        // Final summary
        console.log(`\n🎉 === BULK REFRESH COMPLETE === 🎉`);
        console.log(`📊 Total products in database: ${totalCount}`);
        console.log(`🔄 Total products processed: ${sourcedProducts.length}`);
        console.log(`✅ Successfully refreshed: ${refreshed}`);
        console.log(`❌ Errors: ${errors.length}`);
        console.log(`🏁 ALL ${sourcedProducts.length} products have been processed!`);

        if (results.length > 0) {
            console.log(`\nRefreshed products:`);
            results.forEach((r, i) => {
                console.log(`${i + 1}. ${r.title} (${r.updatedFields.length} fields changed)`);
            });
        }

        if (errors.length > 0) {
            console.log(`\nFailed products:`);
            errors.forEach((e, i) => {
                console.log(`${i + 1}. ${e.title}: ${e.error}`);
            });
        }

        return NextResponse.json({
            success: true,
            message: `All products refreshed: ${refreshed} refreshed, ${errors.length} errors`,
            results: {
                total: sourcedProducts.length,
                refreshed,
                errors: errors.length,
                totalInDatabase: totalCount,
                allProcessed: true,
                details: results,
                errors: errors
            }
        });

    } catch (error: any) {
        console.error('Bulk refresh error:', error);

        if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Insufficient permissions')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        return NextResponse.json({
            error: 'Failed to bulk refresh sourced products',
            details: error.message
        }, { status: 500 });
    }
}
