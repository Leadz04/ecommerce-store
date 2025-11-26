import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import KnowledgeBase from '@/models/KnowledgeBase';
import { verifyTokenOptional } from '@/lib/auth';

// GET /api/knowledge-base/[slug] - Get article by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const authResult = await verifyTokenOptional(request);
    const userId = authResult?.userId;

    const article = await KnowledgeBase.findOne({ slug, isPublished: true }).lean();

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await KnowledgeBase.findByIdAndUpdate(article._id, {
      $inc: { views: 1 },
    });

    // Get related articles
    const relatedArticles = article.relatedArticles && article.relatedArticles.length > 0
      ? await KnowledgeBase.find({
          _id: { $in: article.relatedArticles },
          isPublished: true,
        })
        .select('title slug excerpt category')
        .lean()
      : [];

    return NextResponse.json({
      article: {
        ...article,
        views: (article.views || 0) + 1, // Return incremented count
      },
      relatedArticles,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// PUT /api/knowledge-base/[slug]/helpful - Mark article as helpful
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const authResult = await verifyTokenOptional(request);
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const article = await KnowledgeBase.findOne({ slug, isPublished: true });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const hasAlreadyVoted = article.helpfulUsers.includes(userId);

    if (hasAlreadyVoted) {
      // Remove vote
      article.helpfulUsers = article.helpfulUsers.filter((id: string) => id !== userId);
      article.helpfulCount = Math.max(0, article.helpfulCount - 1);
    } else {
      // Add vote
      article.helpfulUsers.push(userId);
      article.helpfulCount += 1;
    }

    await article.save();

    return NextResponse.json({
      helpfulCount: article.helpfulCount,
      isHelpful: !hasAlreadyVoted,
    });
  } catch (error) {
    console.error('Error updating helpful status:', error);
    return NextResponse.json(
      { error: 'Failed to update helpful status' },
      { status: 500 }
    );
  }
}

