import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import { generateShopifyCSV } from '@/utils/shopifyExport';

/**
 * POST /api/admin/products/export-shopify
 * Export selected products in Shopify CSV format
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const user = await verifyToken(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Get product IDs from request body
        const body = await request.json();
        const { productIds } = body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json(
                { error: 'No products selected' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Fetch selected products
        const products = await Product.find({ _id: { $in: productIds } }).lean();

        if (products.length === 0) {
            return NextResponse.json(
                { error: 'No products found' },
                { status: 404 }
            );
        }

        // Generate Shopify CSV
        const csv = generateShopifyCSV(products);

        // Return CSV file
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="shopify_products_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Error exporting products to Shopify CSV:', error);
        return NextResponse.json(
            { error: 'Failed to export products' },
            { status: 500 }
        );
    }
}
