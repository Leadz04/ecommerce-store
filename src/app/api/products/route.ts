import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { applyDeduplication } from '@/lib/deduplication';

let mainConnection: mongoose.Connection | null = null;

async function getMainConnection() {
  // Return cached connection if available and ready
  if (mainConnection && mainConnection.readyState === 1) {
    console.log('[API /products] Using cached connection');
    return mainConnection;
  }

  // Use the main database connection
  // connectDB() already handles retries, timeouts, and proper error handling
  const mongooseInstance = await connectDB();
  if (!mongooseInstance) {
    throw new Error('MONGODB_URI is not configured');
  }

  const connection = mongooseInstance.connection;

  // Verify connection is ready
  // connectDB() should have already established the connection
  if (connection.readyState !== 1) {
    throw new Error(`Database connection is not ready. State: ${connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
  }

  mainConnection = connection;
  console.log('[API /products] Connection established and cached');
  return mainConnection;
}

export async function GET(request: NextRequest) {
  console.log('[API /products] GET request received');
  try {
    console.log('[API /products] Connecting to main database...');
    try {
      await getMainConnection();
    } catch (connError) {
      console.error('[API /products] Connection error:', connError);
      return NextResponse.json(
        { error: 'Database connection failed', details: connError instanceof Error ? connError.message : String(connError) },
        { status: 500 }
      );
    }

    console.log('[API /products] Database connected successfully');

    const { searchParams } = new URL(request.url);
    console.log('[API /products] Search params:', searchParams.toString());

    // Always use pagination - even with filters active
    const page = parseInt(searchParams.get('page') || '1');
    const requestedLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 24;

    // Production-ready: Cap limit at 100 to prevent performance issues
    // This prevents loading thousands of products at once
    const limit = Math.min(Math.max(requestedLimit, 1), 100);

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const brand = searchParams.get('brand');
    const minRating = searchParams.get('minRating');
    const collection = (searchParams.get('collection') || '').toLowerCase();
    const style = searchParams.get('style');
    const color = searchParams.get('color');

    // Build query - get all products from main database, exclude test products
    // Use a consistent $and array approach to properly combine all conditions
    const andConditions: any[] = [];

    // 1. Exclude test products (identified by name or sourceUrl containing 'test')
    andConditions.push({
      $nor: [
        { name: { $regex: /test/i } },
        { sourceUrl: { $regex: /test/i } },
        { tags: /test/i }
      ]
    });

    // 2. Category filter (if specified and not 'all')
    if (category && category !== 'all') {
      andConditions.push({ category: category });
    }

    // 3. Search filter - search across name, description, and category
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // 4. Price range filter
    if (minPrice || maxPrice) {
      const priceCondition: any = {};
      if (minPrice) priceCondition.$gte = parseFloat(minPrice);
      if (maxPrice) priceCondition.$lte = parseFloat(maxPrice);
      andConditions.push({ price: priceCondition });
    }

    // 5. In stock filter
    if (inStock === 'true') {
      andConditions.push({ inStock: true });
    }

    // 6. Brand filter
    if (brand) {
      andConditions.push({ brand: { $regex: brand, $options: 'i' } });
    }

    // 7. Rating filter
    if (minRating) {
      const parsed = parseFloat(minRating);
      if (!Number.isNaN(parsed)) {
        andConditions.push({ rating: { $gte: parsed } });
      }
    }

    // 8. Style filter - search in tags, productType, and name
    if (style) {
      andConditions.push({
        $or: [
          { tags: { $regex: style, $options: 'i' } },
          { productType: { $regex: style, $options: 'i' } },
          { name: { $regex: style, $options: 'i' } }
        ]
      });
    }

    // 9. Color filter - search in tags, specifications, and name
    if (color) {
      andConditions.push({
        $or: [
          { tags: { $regex: color, $options: 'i' } },
          { name: { $regex: color, $options: 'i' } },
          { 'specifications.Color': { $regex: color, $options: 'i' } },
          { 'specifications.color': { $regex: color, $options: 'i' } }
        ]
      });
    }

    // Build final query with all conditions combined using $and
    const query: any = andConditions.length > 0 ? { $and: andConditions } : {};

    // Collections can influence query and sort
    let sort: any = {};
    if (collection === 'new' || collection === 'new-arrivals') {
      sort.createdAt = -1; // newest first
    } else if (collection === 'best' || collection === 'best-sellers') {
      sort.rating = -1;
      sort.reviewCount = -1;
    } else if (collection === 'seasonal' || collection === 'season') {
      // Add seasonal filter to existing $and array
      if (query.$and) {
        query.$and.push({
          $or: [
            { tags: { $in: [/season/i] } },
            { productType: { $regex: 'season', $options: 'i' } }
          ]
        });
      }
      if (!sortBy || sortBy === 'name') {
        sort.createdAt = -1;
      }
    }

    if (Object.keys(sort).length === 0) {
      switch (sortBy) {
        case 'price-low':
          sort.price = 1;
          break;
        case 'price-high':
          sort.price = -1;
          break;
        case 'rating':
          sort.rating = -1;
          break;
        case 'newest':
          sort.createdAt = -1;
          break;
        default:
          sort.name = 1;
      }
    }

    console.log('[API /products] Executing query:', JSON.stringify(query));
    console.log('[API /products] Pagination:', { page, limit, skip: (page - 1) * limit });

    // Build query with consistent pagination
    let queryBuilder = Product.find(query);

    // Apply sort
    if (Object.keys(sort).length > 0) {
      queryBuilder = queryBuilder.sort(sort);
    }

    // ALWAYS apply pagination - even with filters
    // This ensures consistent performance and prevents overwhelming the client
    queryBuilder = queryBuilder.skip((page - 1) * limit).limit(limit);

    let productsRaw;
    try {
      productsRaw = await queryBuilder.lean();
    } catch (queryError) {
      console.error('[API /products] Query execution error:', queryError);
      // Return empty results instead of error if query fails
      productsRaw = [];
    }

    console.log('[API /products] Found', productsRaw.length, 'products');

    // Apply deduplication to ensure unique products (by name and brand, or by sourceUrl if available)
    // This handles cases where the same product might have different _id values
    const products = applyDeduplication(productsRaw, 'products');

    // Additional deduplication by sourceUrl if available (more reliable for identifying duplicates)
    const seenUrls = new Map<string, any>();
    const uniqueProducts: any[] = [];

    for (const product of products) {
      const url = (product as any).sourceUrl || (product as any).url || '';
      const name = (product as any).name || '';

      // Create a unique key from URL (if available) or name
      const key = url ? url.toLowerCase().trim() : name.toLowerCase().trim();

      if (key && !seenUrls.has(key)) {
        seenUrls.set(key, product);
        uniqueProducts.push(product);
      } else if (!key) {
        // If no URL or name, keep the product (shouldn't happen, but safety check)
        uniqueProducts.push(product);
      }
    }

    console.log('[API /products] After deduplication:', uniqueProducts.length, 'unique products');

    let total = 0;
    let categories: string[] = [];
    let brands: string[] = [];

    try {
      total = await Product.countDocuments(query);
      console.log('[API /products] Total count:', total);

      [categories, brands] = await Promise.all([
        Product.distinct('category', query).catch(() => []),
        Product.distinct('brand', query).catch(() => [])
      ]);
    } catch (countError) {
      console.error('[API /products] Count/distinct error:', countError);
      // Continue with empty arrays if count fails
    }

    console.log('[API /products] Success - Returning', uniqueProducts.length, 'products');
    return NextResponse.json({
      products: uniqueProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      },
      filters: { categories, brands }
    });

  } catch (error) {
    console.error('❌ [API /products] Error:', error);
    console.error('[API /products] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await getMainConnection();

    const productData = await request.json();

    const product = new Product(productData);
    await product.save();

    return NextResponse.json({
      message: 'Product created successfully',
      product
    }, { status: 201 });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
