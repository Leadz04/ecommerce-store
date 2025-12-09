import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

/**
 * Optimized API endpoint for home page top sellers
 * Returns exactly 20 leather jacket products: 13 women + 7 men
 * Sorted by best sellers (rating * reviewCount)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Build query for leather jacket products only
    // Must contain both "leather" and "jacket" in name, description, tags, or productType
    const leatherJacketQuery = {
      $and: [
        {
          $nor: [
            { name: { $regex: /test/i } },
            { sourceUrl: { $regex: /test/i } },
            { tags: /test/i }
          ]
        },
        {
          inStock: true,
          image: {
            $exists: true,
            $ne: null,
            $not: {
              $regex: /res\.cloudinary\.com\/demo|images\.unsplash\.com/
            }
          },
          // Must contain "jacket" AND "leather" somewhere in the product
          $and: [
            {
              $or: [
                { name: { $regex: /jacket/i } },
                { description: { $regex: /jacket/i } },
                { productType: { $regex: /jacket/i } },
                { tags: { $regex: /jacket/i } }
              ]
            },
            {
              $or: [
                { name: { $regex: /leather/i } },
                { description: { $regex: /leather/i } },
                { productType: { $regex: /leather/i } },
                { tags: { $regex: /leather/i } }
              ]
            }
          ]
        }
      ]
    };

    // Fetch products and select the top performers (deterministic - same products every time)
    // Fetch women's leather jacket products (get more than 13 to ensure quality selection)
    const womenProductsRaw = await Product.find({
      ...leatherJacketQuery,
      category: 'Women'
    })
      .sort({ 
        rating: -1,
        reviewCount: -1,
        createdAt: -1
      })
      .limit(20) // Get more than needed for better selection
      .lean();

    // Fetch men's leather jacket products (get more than 7 to ensure quality selection)
    const menProductsRaw = await Product.find({
      ...leatherJacketQuery,
      category: 'Men'
    })
      .sort({ 
        rating: -1,
        reviewCount: -1,
        createdAt: -1
      })
      .limit(15) // Get more than needed for better selection
      .lean();

    // Sort by best seller score (rating * reviewCount)
    const sortByBestSeller = (a: any, b: any) => {
      const aScore = (a.rating || 0) * (a.reviewCount || 0);
      const bScore = (b.rating || 0) * (b.reviewCount || 0);
      if (bScore !== aScore) return bScore - aScore;
      // If scores are equal, prefer higher rating
      return (b.rating || 0) - (a.rating || 0);
    };

    const sortedWomen = [...womenProductsRaw].sort(sortByBestSeller);
    const sortedMen = [...menProductsRaw].sort(sortByBestSeller);

    // Select top 13 women and top 7 men (deterministic - always the same products)
    const selectedWomen = sortedWomen.slice(0, 13);
    const selectedMen = sortedMen.slice(0, 7);

    // Combine: women first, then men (or you can interleave them)
    // For best seller display, we'll show women first, then men
    const finalProducts = [...selectedWomen, ...selectedMen];

    return NextResponse.json({
      products: finalProducts,
      count: finalProducts.length,
      womenCount: selectedWomen.length,
      menCount: selectedMen.length
    });

  } catch (error) {
    console.error('[API /homepage/top-sellers] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', products: [], count: 0 },
      { status: 500 }
    );
  }
}

