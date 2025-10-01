import { NextRequest, NextResponse } from 'next/server';
import { SEOAPIs } from '@/lib/external-apis';
import connectDB from '@/lib/mongodb';
import { SeoQuery, SeoKeyword } from '@/models';

export async function GET(request: NextRequest) {
  console.log('[API] /api/seo/keywords GET start');
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!q.trim()) {
      console.warn('[API] /api/seo/keywords missing q');
      return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 });
    }

    await connectDB();
    const seo = new SEOAPIs();
    const results = await seo.searchKeywordsSerpAPI(q, Math.min(limit, 50));

    // Save query and keywords to DB with raw response snapshot
    await SeoQuery.create({ query: q, type: 'keywords', resultsCount: results.length, rawResponse: { provider: 'serpapi', query: q, timestamp: Date.now(), results } });
    for (const k of results) {
      await SeoKeyword.findOneAndUpdate(
        { query: q, keyword: k.keyword },
        { query: q, keyword: k.keyword, searchVolume: k.searchVolume, competition: k.competition, difficulty: k.difficulty, source: 'serpapi' },
        { upsert: true, new: true }
      );
    }

    console.log('[API] /api/seo/keywords success', { count: results.length });
    return NextResponse.json({ success: true, keywords: results, total: results.length });
  } catch (error) {
    console.error('[API] /api/seo/keywords error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch keywords' }, { status: 500 });
  }
}

