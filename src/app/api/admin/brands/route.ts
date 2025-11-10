import { NextRequest, NextResponse } from 'next/server';
import { getSourcedProductModel } from '@/models/SourcedProduct';
import connectDB from '@/lib/mongodb'; // Default export
import { Product } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get brands from both scraped products and existing products
    const [scrapedBrands, productBrands] = await Promise.all([
      (async () => {
        try {
          const Sourced = await getSourcedProductModel();
          const brands = await Sourced.distinct('brand');
          return brands.filter((b): b is string => Boolean(b) && typeof b === 'string');
        } catch {
          return [];
        }
      })(),
      (async () => {
        try {
          await connectDB();
          const brands = await Product.distinct('brand');
          return brands.filter((b): b is string => Boolean(b) && typeof b === 'string');
        } catch {
          return [];
        }
      })(),
    ]);

    // Combine and deduplicate brands
    const allBrands = [...new Set([...scrapedBrands, ...productBrands])]
      .filter(b => b && b.trim().length > 0)
      .sort();

    return NextResponse.json({ brands: allBrands });
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

