import { NextRequest, NextResponse } from 'next/server';
import { getSourcedProductModel } from '@/models/SourcedProduct';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;
    const categoryGroup = (searchParams.get('categoryGroup') || '').trim();
    const sourceUrl = (searchParams.get('sourceUrl') || '').trim();
    const groupByBrand = searchParams.get('groupByBrand') === 'true';

    const Sourced = await getSourcedProductModel();
    const query: any = {};
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { sourceUrl: { $regex: q, $options: 'i' } },
      ];
    }
    if (categoryGroup) query.categoryGroup = categoryGroup;
    if (sourceUrl) query.sourceUrl = sourceUrl;

    if (groupByBrand) {
      // Group by brand with pagination support
      const brandParam = (searchParams.get('brand') || '').trim();
      const brandPage = Math.max(1, parseInt(searchParams.get('brandPage') || '1'));
      const brandLimit = Math.min(50, Math.max(1, parseInt(searchParams.get('brandLimit') || '12')));
      const brandSkip = (brandPage - 1) * brandLimit;

      // Get all unique brands first
      const allBrands = await Sourced.distinct('brand', query);
      const brands = allBrands.filter((b): b is string => Boolean(b) && typeof b === 'string').sort();

      // If a specific brand is requested, return paginated products for that brand
      if (brandParam) {
        const brandQuery = { ...query, brand: brandParam };
        const [items, total] = await Promise.all([
          Sourced.find(brandQuery).sort({ createdAt: -1 }).skip(brandSkip).limit(brandLimit).lean(),
          Sourced.countDocuments(brandQuery),
        ]);

        return NextResponse.json({
          items,
          total,
          page: brandPage,
          limit: brandLimit,
          pages: Math.ceil(total / brandLimit),
          brand: brandParam,
          brands,
        });
      }

      // Otherwise, return brand list with counts (no products)
      const brandCounts: Record<string, number> = {};
      for (const brand of brands) {
        const count = await Sourced.countDocuments({ ...query, brand });
        brandCounts[brand] = count;
      }

      return NextResponse.json({
        brands,
        brandCounts,
        total: Object.values(brandCounts).reduce((sum, count) => sum + count, 0),
      });
    }

    const [items, total] = await Promise.all([
      Sourced.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Sourced.countDocuments(query),
    ]);

    return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to list sourced products' }, { status: 500 });
  }
}


