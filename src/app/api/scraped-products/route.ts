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

        // Filters - trim and normalize all string inputs
        const department = searchParams.get('department')?.trim();
        const category = searchParams.get('category')?.trim();
        const subCategory = searchParams.get('subCategory')?.trim();
        const brand = searchParams.get('brand')?.trim();
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const search = searchParams.get('search')?.trim();

        // Helper to escape regex special characters
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 1. Build Query - use $and to properly combine all filters
        const andConditions: any[] = [
            { sourceUrl: { $exists: true, $ne: null } } // Only scraped products
        ];

        if (department) {
            // Case-insensitive exact match using MongoDB regex format
            const escapedDept = escapeRegex(department);
            andConditions.push({ 
                department: { 
                    $regex: `^${escapedDept}$`, 
                    $options: 'i' 
                } 
            });
        }
        if (category) {
            // Case-insensitive exact match using MongoDB regex format
            const escapedCat = escapeRegex(category);
            andConditions.push({ 
                category: { 
                    $regex: `^${escapedCat}$`, 
                    $options: 'i' 
                } 
            });
        }
        if (subCategory) {
            // Case-insensitive exact match using MongoDB regex format
            const escapedSub = escapeRegex(subCategory);
            andConditions.push({ 
                subCategory: { 
                    $regex: `^${escapedSub}$`, 
                    $options: 'i' 
                } 
            });
        }
        if (brand) {
            // Case-insensitive exact match using MongoDB regex format
            const escapedBrand = escapeRegex(brand);
            andConditions.push({ 
                brand: { 
                    $regex: `^${escapedBrand}$`, 
                    $options: 'i' 
                } 
            });
        }

        if (minPrice || maxPrice) {
            const priceCondition: any = {};
            if (minPrice) priceCondition.$gte = parseFloat(minPrice);
            if (maxPrice) priceCondition.$lte = parseFloat(maxPrice);
            andConditions.push({ price: priceCondition });
        }

        if (search) {
            // Use regex for partial match on name or brand
            const escapedSearch = escapeRegex(search);
            andConditions.push({
                $or: [
                    { name: { $regex: escapedSearch, $options: 'i' } },
                    { brand: { $regex: escapedSearch, $options: 'i' } }
                ]
            });
        }

        // Combine all conditions with $and - always use $and when we have multiple conditions
        const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

        // Debug logging
        console.log('[scraped-products] Query:', JSON.stringify(query, null, 2));
        console.log('[scraped-products] Filters:', { department, category, subCategory, brand, minPrice, maxPrice, search });
        console.log('[scraped-products] Number of conditions:', andConditions.length);
        console.log('[scraped-products] Conditions:', JSON.stringify(andConditions, null, 2));

        // Diagnostic: Check what values actually exist in DB for debugging
        if (department || category) {
            const sampleQuery: any = { sourceUrl: { $exists: true, $ne: null } };
            if (department) {
                sampleQuery.department = { $exists: true, $ne: null };
            }
            if (category) {
                sampleQuery.category = { $exists: true, $ne: null };
            }
            const sampleProducts = await Product.find(sampleQuery).limit(5).select('department category subCategory brand').lean();
            console.log('[scraped-products] Sample products from DB:', JSON.stringify(sampleProducts, null, 2));
            
            // Get distinct values
            const distinctDepts = await Product.distinct('department', { sourceUrl: { $exists: true, $ne: null } });
            const distinctCats = await Product.distinct('category', { sourceUrl: { $exists: true, $ne: null } });
            console.log('[scraped-products] Distinct departments in DB:', distinctDepts);
            console.log('[scraped-products] Distinct categories in DB:', distinctCats);
            
            // If department is selected, show what categories exist for that department
            if (department) {
                const deptEscaped = escapeRegex(department);
                const categoriesForDept = await Product.distinct('category', { 
                    sourceUrl: { $exists: true, $ne: null },
                    department: { $regex: `^${deptEscaped}$`, $options: 'i' }
                });
                console.log(`[scraped-products] Categories for department="${department}":`, categoriesForDept);
            }
            
            // If category is selected, show what departments exist for that category
            if (category) {
                const catEscaped = escapeRegex(category);
                const departmentsForCat = await Product.distinct('department', { 
                    sourceUrl: { $exists: true, $ne: null },
                    category: { $regex: `^${catEscaped}$`, $options: 'i' }
                });
                console.log(`[scraped-products] Departments for category="${category}":`, departmentsForCat);
            }
        }

        // 2. Fetch Products with Pagination
        const products = await Product.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .skip((page - 1) * limit)
            .limit(limit)
            .select('-raw -descriptionHtml'); // Exclude heavy fields for list view

        const total = await Product.countDocuments(query);
        
        console.log(`[scraped-products] Found ${products.length} products (total: ${total}) for page ${page}`);
        
        // If no results but we expect some, log a test query
        if (total === 0 && (department || category || brand)) {
            console.log('[scraped-products] ⚠️ No results found. Testing individual filters...');
            if (department) {
                const deptCount = await Product.countDocuments({ 
                    sourceUrl: { $exists: true, $ne: null },
                    department: { $regex: `^${escapeRegex(department)}$`, $options: 'i' }
                });
                console.log(`[scraped-products] Products with department="${department}": ${deptCount}`);
            }
            if (category) {
                const catCount = await Product.countDocuments({ 
                    sourceUrl: { $exists: true, $ne: null },
                    category: { $regex: `^${escapeRegex(category)}$`, $options: 'i' }
                });
                console.log(`[scraped-products] Products with category="${category}": ${catCount}`);
            }
            if (brand) {
                const brandCount = await Product.countDocuments({ 
                    sourceUrl: { $exists: true, $ne: null },
                    brand: { $regex: `^${escapeRegex(brand)}$`, $options: 'i' }
                });
                console.log(`[scraped-products] Products with brand="${brand}": ${brandCount}`);
            }
        }

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
