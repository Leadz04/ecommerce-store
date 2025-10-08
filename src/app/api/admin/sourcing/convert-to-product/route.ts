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

        const body = await request.json();
        const { sourcedId } = body;

        if (!sourcedId) {
            return NextResponse.json({ error: 'Sourced product ID is required' }, { status: 400 });
        }

        // Get the sourced product
        const Sourced = await getSourcedProductModel();
        const sourcedProduct = await Sourced.findById(sourcedId);

        if (!sourcedProduct) {
            return NextResponse.json({ error: 'Sourced product not found' }, { status: 404 });
        }

        // Check if a product with this source URL already exists
        const existingProduct = await Product.findOne({ sourceUrl: sourcedProduct.sourceUrl });
        if (existingProduct) {
            return NextResponse.json({
                error: 'Product with this source URL already exists',
                productId: existingProduct._id.toString()
            }, { status: 409 });
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

        const product = new Product(productData);
        await product.save();

        // Audit log
        try {
            const ip = request.headers.get('x-forwarded-for') || request.ip || '';
            const userAgent = request.headers.get('user-agent') || '';
            await AuditLog.create({
                userId: user.userId,
                action: 'product:create_from_sourced',
                resourceType: 'Product',
                resourceId: String(product._id),
                metadata: {
                    name: product.name,
                    status: product.status,
                    sourcedId: sourcedId,
                    sourceUrl: sourcedProduct.sourceUrl
                },
                ip,
                userAgent,
            });
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({
            success: true,
            message: 'Product created successfully from sourced data',
            product: {
                id: product._id.toString(),
                name: product.name,
                price: product.price,
                status: product.status,
                sourceUrl: product.sourceUrl
            }
        });

    } catch (error: any) {
        console.error('Convert sourced to product error:', error);

        if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Insufficient permissions')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        return NextResponse.json({
            error: 'Failed to convert sourced product to main product',
            details: error.message
        }, { status: 500 });
    }
}
