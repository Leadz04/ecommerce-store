import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/blogs - list with pagination and search
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (status) {
      query.status = status;
    }

    query.isDeleted = false;
    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .sort({ publishAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({ blogs, total, page, limit });
  } catch (error) {
    console.error('List blogs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/blogs - create blog
export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();

    const body = await request.json();
    const { title, slug, description, contentHtml, coverImage, tags, status = 'draft', publishAt = null, isActive = true } = body;

    // Basic sanitization: strip <script> tags
    const sanitizedHtml = typeof contentHtml === 'string' ? contentHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') : '';

    if (!title || !slug || !contentHtml) {
      return NextResponse.json({ error: 'Title, slug and content are required' }, { status: 400 });
    }

    const existing = await Blog.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const blog = new Blog({
      title,
      slug: slug.toLowerCase(),
      description,
      contentHtml: sanitizedHtml,
      coverImage,
      tags: Array.isArray(tags) ? tags : [],
      status,
      publishAt: publishAt ? new Date(publishAt) : null,
      isActive,
    });

    await blog.save();
    return NextResponse.json({ message: 'Blog created', blog }, { status: 201 });
  } catch (error) {
    console.error('Create blog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


