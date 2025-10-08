import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getSourcedProductModel } from '@/models/SourcedProduct';
import { Product } from '@/models';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';

export const dynamic = 'force-dynamic';
// Force rebuild

export async function POST(request: NextRequest) {
    try {
        const user = await requirePermission(PERMISSIONS.PRODUCT_CREATE)(request);
        await connectDB();

        console.log('Database connected, Product model available:', !!Product);

        const body = await request.json();
        const { sourcedIds } = body;

        if (!Array.isArray(sourcedIds) || sourcedIds.length === 0) {
            return NextResponse.json({ error: 'Sourced product IDs array is required' }, { status: 400 });
        }

        // Get the sourced products
        const Sourced = await getSourcedProductModel();
        const sourcedProducts = await Sourced.find({ _id: { $in: sourcedIds } });

        console.log(`Found ${sourcedProducts.length} sourced products out of ${sourcedIds.length} requested`);

        if (sourcedProducts.length === 0) {
            return NextResponse.json({ error: 'No sourced products found' }, { status: 404 });
        }

        const results = [];
        const errors = [];
        const createdProducts = [];

        for (const sourcedProduct of sourcedProducts) {
            try {
                // Validate sourced product data
                if (!sourcedProduct.title || !sourcedProduct.sourceUrl) {
                    errors.push({
                        sourcedId: sourcedProduct._id.toString(),
                        title: sourcedProduct.title || 'Unknown',
                        error: 'Missing required fields (title or sourceUrl)'
                    });
                    continue;
                }

                // Check if a product with this source URL already exists
                const existingProduct = await Product.findOne({ sourceUrl: sourcedProduct.sourceUrl });
                if (existingProduct) {
                    errors.push({
                        sourcedId: sourcedProduct._id.toString(),
                        title: sourcedProduct.title,
                        error: 'Product with this source URL already exists',
                        productId: existingProduct._id.toString()
                    });
                    continue;
                }

                // Create new product from sourced data
                const productData = {
                    name: sourcedProduct.title || 'Untitled Product',
                    description: sourcedProduct.description || sourcedProduct.title || 'No description available',
                    price: sourcedProduct.price || 0,
                    image: sourcedProduct.images?.[0] || '/placeholder-product.svg',
                    images: sourcedProduct.images || [],
                    category: 'Accessories', // Default category, can be updated later
                    brand: 'Angel Jackets', // Default brand
                    rating: 0,
                    reviewCount: 0,
                    inStock: true,
                    stockCount: 1,
                    tags: ['sourced', 'imported'],
                    specifications: sourcedProduct.specs || {},
                    isActive: false, // Start as inactive so it can be reviewed
                    sourceUrl: sourcedProduct.sourceUrl,
                    productType: 'sourced',
                    status: 'draft',
                };

                // Validate required fields
                if (!productData.name || !productData.description || productData.price === undefined || !productData.image) {
                    errors.push({
                        sourcedId: sourcedProduct._id.toString(),
                        title: sourcedProduct.title,
                        error: `Missing required fields: name=${!!productData.name}, description=${!!productData.description}, price=${productData.price !== undefined}, image=${!!productData.image}`
                    });
                    continue;
                }

                console.log(`Creating product for: ${sourcedProduct.title}`, {
                    name: productData.name,
                    price: productData.price,
                    sourceUrl: productData.sourceUrl
                });

                const product = new Product(productData);
                await product.save();

                createdProducts.push(product);

                results.push({
                    sourcedId: sourcedProduct._id.toString(),
                    productId: product._id.toString(),
                    name: product.name,
                    price: product.price,
                    status: product.status
                });

            } catch (error: any) {
                console.error(`Error creating product for sourced item ${sourcedProduct._id}:`, error);
                errors.push({
                    sourcedId: sourcedProduct._id.toString(),
                    title: sourcedProduct.title || 'Unknown',
                    error: error.message || 'Failed to create product',
                    details: error.stack || error.toString()
                });
            }
        }

        // Audit log for bulk operation
        try {
            const ip = request.headers.get('x-forwarded-for') || request.ip || '';
            const userAgent = request.headers.get('user-agent') || '';
            await AuditLog.create({
                userId: user.userId,
                action: 'product:bulk_create_from_sourced',
                resourceType: 'Product',
                resourceId: createdProducts.map(p => p._id.toString()).join(','),
                metadata: {
                    totalRequested: sourcedIds.length,
                    totalCreated: results.length,
                    totalErrors: errors.length,
                    createdProducts: results.map(r => ({ id: r.productId, name: r.name }))
                },
                ip,
                userAgent,
            });
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({
            success: true,
            message: `Bulk conversion completed: ${results.length} created, ${errors.length} errors`,
            results,
            errors,
            summary: {
                totalRequested: sourcedIds.length,
                totalCreated: results.length,
                totalErrors: errors.length
            }
        });

    } catch (error: any) {
        console.error('Bulk convert sourced to products error:', error);

        if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Insufficient permissions')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        return NextResponse.json({
            error: 'Failed to bulk convert sourced products to main products',
            details: error.message
        }, { status: 500 });
    }
}
