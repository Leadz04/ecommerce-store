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

// Helper to escape regex special characters
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper to normalize category/productType for better matching (Shopify-style)
const normalizeCategory = (cat: string): string => {
  if (!cat) return '';
  return cat.trim().toLowerCase();
};

// Helper to normalize product types (similar to Shopify's product_type normalization)
// This helps match variations like "Uppers", "Upper", "Upper Wear", etc.
const normalizeProductType = (type: string): string => {
  if (!type) return '';
  const normalized = type.trim().toLowerCase();
  
  // Common variations mapping (Shopify-style normalization)
  const variations: Record<string, string> = {
    'upper': 'uppers',
    'upper wear': 'uppers',
    'upperwear': 'uppers',
    'trouser': 'trousers',
    'pant': 'pants',
    'pants': 'trousers',
    'jacket': 'jackets',
    'coat': 'coats',
    'shirt': 'shirts',
    'sweater': 'sweaters',
    'sweatshirt': 'sweatshirts',
    'hoodie': 'hoodies',
  };
  
  return variations[normalized] || normalized;
};

export async function GET(request: NextRequest) {
  try {
    await getMainConnection();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100); // Cap at 100

    // Extract all filter parameters
    const mainCategory = searchParams.get('mainCategory')?.trim();
    const category = searchParams.get('category')?.trim();
    const subCategory = searchParams.get('subCategory')?.trim();
    const productType = searchParams.get('productType')?.trim();
    const brand = searchParams.get('brand')?.trim();
    const vendor = searchParams.get('vendor')?.trim();
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search')?.trim();
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const inStock = searchParams.get('inStock');
    const onSale = searchParams.get('onSale');
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Build query conditions
    const andConditions: any[] = [
      { isActive: true } // Only active products
    ];

    // Main Category filter (Men, Women, Kids, etc.)
    // Check multiple fields: category, department, productType, subCategory, specifications, tags, and name
    // This aligns with Shopify's flexible filtering approach
    if (mainCategory && mainCategory !== 'all') {
      const escaped = escapeRegex(mainCategory);
      const mainCategoryOr: any[] = [
        { category: { $regex: escaped, $options: 'i' } },
        { department: { $regex: escaped, $options: 'i' } },
        { productType: { $regex: escaped, $options: 'i' } },
        { subCategory: { $regex: escaped, $options: 'i' } },
        { 'specifications.Category': { $regex: escaped, $options: 'i' } },
        { 'specifications.Department': { $regex: escaped, $options: 'i' } },
        { 'specifications.Type': { $regex: escaped, $options: 'i' } },
        { tags: { $in: [new RegExp(escaped, 'i')] } },
        // Also check product name for cases like "Men's Jacket" or "Women Trousers"
        { name: { $regex: escaped, $options: 'i' } }
      ];
      
      andConditions.push({ $or: mainCategoryOr });
    }

    // Category filter - check multiple fields for flexibility
    if (category) {
      const escaped = escapeRegex(category);
      andConditions.push({
        $or: [
          { category: { $regex: escaped, $options: 'i' } },
          { subCategory: { $regex: escaped, $options: 'i' } },
          { productType: { $regex: escaped, $options: 'i' } },
          { 'specifications.Category': { $regex: escaped, $options: 'i' } },
          { 'specifications.Type': { $regex: escaped, $options: 'i' } },
          { tags: { $in: [new RegExp(escaped, 'i')] } }
        ]
      });
    }

    // SubCategory filter - check multiple fields for flexibility
    if (subCategory) {
      const escaped = escapeRegex(subCategory);
      andConditions.push({
        $or: [
          { subCategory: { $regex: escaped, $options: 'i' } },
          { category: { $regex: escaped, $options: 'i' } },
          { productType: { $regex: escaped, $options: 'i' } },
          { 'specifications.SubCategory': { $regex: escaped, $options: 'i' } },
          { 'specifications.Category': { $regex: escaped, $options: 'i' } },
          { 'specifications.Type': { $regex: escaped, $options: 'i' } },
          { tags: { $in: [new RegExp(escaped, 'i')] } }
        ]
      });
    }

    // Product Type filter - check multiple fields for maximum flexibility
    // This is the most important filter to make flexible since data is inconsistent
    if (productType) {
      const escaped = escapeRegex(productType);
      andConditions.push({
        $or: [
          { productType: { $regex: escaped, $options: 'i' } },
          { category: { $regex: escaped, $options: 'i' } },
          { subCategory: { $regex: escaped, $options: 'i' } },
          { 'specifications.Type': { $regex: escaped, $options: 'i' } },
          { 'specifications.Category': { $regex: escaped, $options: 'i' } },
          { 'specifications.Product Type': { $regex: escaped, $options: 'i' } },
          { tags: { $in: [new RegExp(escaped, 'i')] } },
          { name: { $regex: escaped, $options: 'i' } } // Also check product name
        ]
      });
    }

    // Brand filter - prioritize vendor field (Shopify's primary brand identifier)
    // Check brand field, specifications, and also vendor-related fields
    if (brand) {
      const escaped = escapeRegex(brand);
      andConditions.push({
        $or: [
          { brand: { $regex: escaped, $options: 'i' } },
          { 'specifications.Vendor': { $regex: escaped, $options: 'i' } },
          { 'specifications.Brand': { $regex: escaped, $options: 'i' } },
          { 'specifications.Maker': { $regex: escaped, $options: 'i' } },
          // Also check name for brand mentions
          { name: { $regex: escaped, $options: 'i' } }
        ]
      });
    }

    // Vendor filter (Shopify's vendor field) - check multiple locations
    // This is Shopify's primary way to identify brands
    if (vendor) {
      const escaped = escapeRegex(vendor);
      andConditions.push({
        $or: [
          { 'specifications.Vendor': { $regex: escaped, $options: 'i' } },
          { brand: { $regex: escaped, $options: 'i' } },
          { 'specifications.Brand': { $regex: escaped, $options: 'i' } }
        ]
      });
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceCondition: any = {};
      if (minPrice) priceCondition.$gte = parseFloat(minPrice);
      if (maxPrice) priceCondition.$lte = parseFloat(maxPrice);
      andConditions.push({ price: priceCondition });
    }

    // Tag filter (multiple tags supported)
    if (tags.length > 0) {
      andConditions.push({
        tags: { $in: tags.map(tag => new RegExp(escapeRegex(tag), 'i')) }
      });
    }

    // In Stock filter
    if (inStock === 'true') {
      andConditions.push({ inStock: true });
    }

    // On Sale filter
    if (onSale === 'true') {
      andConditions.push({
        $expr: {
          $gt: ['$originalPrice', '$price']
        }
      });
    }

    // Search filter (searches name, description, brand, tags)
    if (search) {
      const escaped = escapeRegex(search);
      andConditions.push({
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { brand: { $regex: escaped, $options: 'i' } },
          { tags: { $in: [new RegExp(escaped, 'i')] } },
          { productType: { $regex: escaped, $options: 'i' } }
        ]
      });
    }

    // Combine all conditions
    const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

    // Build sort object
    let sort: any = {};
    switch (sortBy) {
      case 'price-asc':
        sort = { price: 1 };
        break;
      case 'price-desc':
        sort = { price: -1 };
        break;
      case 'name-asc':
        sort = { name: 1 };
        break;
      case 'name-desc':
        sort = { name: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'rating':
        sort = { rating: -1, reviewCount: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Debug logging for troubleshooting
    if (mainCategory || category || productType || brand) {
      console.log('[brand-products API] Filter query:', JSON.stringify(query, null, 2));
    }

    // Fetch products with pagination
    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(query);

    // If no results, log diagnostic info
    if (total === 0 && (mainCategory || category || productType || brand)) {
      console.log('[brand-products API] No results found. Checking individual filters...');
      
      // Check each filter individually
      const baseQuery = { isActive: true };
      
      if (mainCategory) {
        const escaped = escapeRegex(mainCategory);
        const mainCatCount = await Product.countDocuments({
          ...baseQuery,
          $or: [
            { category: { $regex: escaped, $options: 'i' } },
            { department: { $regex: escaped, $options: 'i' } },
            { productType: { $regex: escaped, $options: 'i' } },
            { subCategory: { $regex: escaped, $options: 'i' } },
            { 'specifications.Category': { $regex: escaped, $options: 'i' } },
            { tags: { $in: [new RegExp(escaped, 'i')] } },
            { name: { $regex: escaped, $options: 'i' } }
          ]
        });
        console.log(`[brand-products API] Products matching mainCategory="${mainCategory}" (flexible search): ${mainCatCount}`);
      }
      
      if (productType) {
        // Check individual fields
        const typeCount = await Product.countDocuments({
          ...baseQuery,
          productType: { $regex: escapeRegex(productType), $options: 'i' }
        });
        const categoryCount = await Product.countDocuments({
          ...baseQuery,
          category: { $regex: escapeRegex(productType), $options: 'i' }
        });
        const subCategoryCount = await Product.countDocuments({
          ...baseQuery,
          subCategory: { $regex: escapeRegex(productType), $options: 'i' }
        });
        const specsTypeCount = await Product.countDocuments({
          ...baseQuery,
          'specifications.Type': { $regex: escapeRegex(productType), $options: 'i' }
        });
        const tagsCount = await Product.countDocuments({
          ...baseQuery,
          tags: { $in: [new RegExp(escapeRegex(productType), 'i')] }
        });
        
        console.log(`[brand-products API] Products with productType="${productType}": ${typeCount}`);
        console.log(`[brand-products API] Products with category="${productType}": ${categoryCount}`);
        console.log(`[brand-products API] Products with subCategory="${productType}": ${subCategoryCount}`);
        console.log(`[brand-products API] Products with specifications.Type="${productType}": ${specsTypeCount}`);
        console.log(`[brand-products API] Products with tags="${productType}": ${tagsCount}`);
        
        // Get sample values from different fields
        const allTypes = await Product.distinct('productType', {
          ...baseQuery,
          productType: { $regex: escapeRegex(productType), $options: 'i' }
        });
        const allCategories = await Product.distinct('category', {
          ...baseQuery,
          category: { $regex: escapeRegex(productType), $options: 'i' }
        });
        const sampleTypes = allTypes.slice(0, 5);
        const sampleCategories = allCategories.slice(0, 5);
        console.log(`[brand-products API] Sample productTypes:`, sampleTypes);
        console.log(`[brand-products API] Sample categories:`, sampleCategories);
      }
      
      if (brand) {
        const brandCount = await Product.countDocuments({
          ...baseQuery,
          brand: { $regex: `^${escapeRegex(brand)}$`, $options: 'i' }
        });
        console.log(`[brand-products API] Products with brand="${brand}": ${brandCount}`);
        
        // Get similar brand names
        const allBrands = await Product.distinct('brand', {
          ...baseQuery,
          brand: { $regex: escapeRegex(brand), $options: 'i' }
        });
        const similarBrands = allBrands.slice(0, 10);
        console.log(`[brand-products API] Similar brands to "${brand}":`, similarBrands);
      }
    }

    // Calculate facets based on current filters (faceted search)
    // This gives counts for available options based on current filter state
    const baseQueryForFacets = andConditions.length > 1 
      ? { $and: andConditions.filter((c: any) => {
          // Exclude the facet field itself from base query
          const excludeFields = ['category', 'subCategory', 'productType', 'brand', 'specifications.Vendor', 'tags'];
          const queryStr = JSON.stringify(c);
          return !excludeFields.some(field => queryStr.includes(field));
        }) }
      : { isActive: true };

    // Get price range from actual data
    const priceStats = await Product.aggregate([
      { $match: baseQueryForFacets },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    // Calculate facets using aggregation
    const facetsResult = await Product.aggregate([
      { $match: baseQueryForFacets },
      {
        $facet: {
          categories: [
            { $match: { category: { $exists: true, $ne: null } } },
            { $sortByCount: '$category' }
          ],
          subCategories: [
            { $match: { subCategory: { $exists: true, $ne: null } } },
            { $sortByCount: '$subCategory' }
          ],
          productTypes: [
            { $match: { productType: { $exists: true, $ne: null } } },
            { $sortByCount: '$productType' }
          ],
          brands: [
            { $match: { brand: { $exists: true, $ne: null } } },
            { $sortByCount: '$brand' }
          ],
          vendors: [
            { $match: { 'specifications.Vendor': { $exists: true, $ne: null } } },
            { $sortByCount: '$specifications.Vendor' }
          ],
          popularTags: [
            { $unwind: '$tags' },
            { $match: { tags: { $exists: true, $ne: null, $ne: '' } } },
            { $sortByCount: '$tags' },
            { $limit: 50 } // Top 50 tags
          ]
        }
      }
    ]);

    // Format facets
    const formatFacets = (arr: any[]): Record<string, number> => {
      const out: Record<string, number> = {};
      arr.forEach(item => {
        if (item._id) out[item._id] = item.count;
      });
      return out;
    };

    const rawFacets = facetsResult[0] || {};
    const facets = {
      categories: formatFacets(rawFacets.categories || []),
      subCategories: formatFacets(rawFacets.subCategories || []),
      productTypes: formatFacets(rawFacets.productTypes || []),
      brands: formatFacets(rawFacets.brands || []),
      vendors: formatFacets(rawFacets.vendors || []),
      tags: formatFacets(rawFacets.popularTags || []),
      priceRange: {
        min: priceStats[0]?.minPrice || 0,
        max: priceStats[0]?.maxPrice || 100000,
        avg: Math.round(priceStats[0]?.avgPrice || 0)
      }
    };

    return NextResponse.json({
      success: true,
      products: products || [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      facets
    });

  } catch (error: any) {
    console.error('[brand-products API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal Server Error', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

