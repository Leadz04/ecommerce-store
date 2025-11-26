import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import KnowledgeBase from '@/models/KnowledgeBase';
import { verifyTokenOptional } from '@/lib/auth';

// GET /api/knowledge-base - Get knowledge base articles
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isPublished: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (featured) {
      query.isFeatured = true;
    }

    if (search && search.trim().length > 0) {
      query.$text = { $search: search.trim() };
    }

    // Build sort
    let sort: any = { order: 1, createdAt: -1 };
    if (search) {
      sort = { score: { $meta: 'textScore' }, ...sort };
    }

    const articles = await KnowledgeBase.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-content') // Don't return full content in list
      .lean();

    const total = await KnowledgeBase.countDocuments(query);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

