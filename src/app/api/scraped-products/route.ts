import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

let mainConnection: mongoose.Connection | null = null;

async function getMainConnection() {
  if (mainConnection && mainConnection.readyState === 1) {
    return mainConnection;
  }

  const mongooseInstance = await connectDB();
  if (!mongooseInstance) {
    throw new Error('MONGODB_URI is not configured');
  }

  mainConnection = mongooseInstance.connection;
  return mainConnection;
}

export async function GET(request: NextRequest) {
    try {
        // Ensure we're using the main database connection
        await getMainConnection();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Filters
        const department = searchParams.get('department');
        const category = searchParams.get('category');
        const subCategory = searchParams.get('subCategory');
        const brand = searchParams.get('brand');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const search = searchParams.get('search');

        // Helper to escape regex special characters
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 1. Build Query - use $and to properly combine all filters
        const andConditions: any[] = [
            { sourceUrl: { $exists: true, $ne: null } } // Only scraped products
        ];

        if (department) {
            // Exact match, case-insensitive
            const escapedDept = escapeRegex(department);
            andConditions.push({ department: new RegExp(`^${escapedDept}$`, 'i') });
        }
        if (category) {
            // Exact match, case-insensitive
            const escapedCat = escapeRegex(category);
            andConditions.push({ category: new RegExp(`^${escapedCat}$`, 'i') });
        }
        if (subCategory) {
            // Exact match, case-insensitive
            const escapedSub = escapeRegex(subCategory);
            andConditions.push({ subCategory: new RegExp(`^${escapedSub}$`, 'i') });
        }
        if (brand) {
            // Exact match, case-insensitive for brand
            const escapedBrand = escapeRegex(brand);
            andConditions.push({ brand: new RegExp(`^${escapedBrand}$`, 'i') });
        }

        if (minPrice || maxPrice) {
            const priceCondition: any = {};
            if (minPrice) priceCondition.$gte = parseFloat(minPrice);
            if (maxPrice) priceCondition.$lte = parseFloat(maxPrice);
            andConditions.push({ price: priceCondition });
        }

        if (search) {
            // Use regex for partial match on name or brand
            const regex = new RegExp(search, 'i');
            andConditions.push({
                $or: [
                    { name: regex },
                    { brand: regex }
                ]
            });
        }

        // Combine all conditions with $and
        const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

        // Debug logging
        console.log('[scraped-products] Query:', JSON.stringify(query, null, 2));
        console.log('[scraped-products] Filters:', { department, category, subCategory, brand, minPrice, maxPrice, search });

        // 2. Fetch Products with Pagination
        const products = await Product.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .skip((page - 1) * limit)
            .limit(limit)
            .select('-raw -descriptionHtml'); // Exclude heavy fields for list view

        const total = await Product.countDocuments(query);
        
        console.log(`[scraped-products] Found ${products.length} products (total: ${total}) for page ${page}`);

        // 3. Calculate Facets (Aggregation)
        // Note: Facets should ideally reflect the *current search* but broad enough to show options.
        // For now, let's get facets for the *entire* scraped dataset to keep UI stable, 
        // or filtered by current "department" if selected to narrow down.
        // Let's do Global Facets for scraped products for simplicity and performance.

        // Optimize: Only run aggregation if needed, or cache it?
        // For now, let's run it.
        const facetsResult = await Product.aggregate([
            { $match: { sourceUrl: { $exists: true, $ne: null } } },
            {
                $facet: {
                    departments: [{ $sortByCount: "$department" }],
                    categories: [{ $sortByCount: "$category" }],
                    subCategories: [{ $sortByCount: "$subCategory" }],
                    brands: [{ $sortByCount: "$brand" }]
                }
            }
        ]);

        const formatFacets = (arr: any[]) => {
            const out: Record<string, number> = {};
            arr.forEach(i => { if (i._id) out[i._id] = i.count; });
            return out;
        };

        const rawFacets = facetsResult[0];
        const facets = {
            departments: formatFacets(rawFacets.departments),
            categories: formatFacets(rawFacets.categories),
            subCategories: formatFacets(rawFacets.subCategories),
            brands: formatFacets(rawFacets.brands)
        };

        // Ensure products is always an array
        const productsArray = Array.isArray(products) ? products : [];

        return NextResponse.json({
            products: productsArray,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            facets
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
