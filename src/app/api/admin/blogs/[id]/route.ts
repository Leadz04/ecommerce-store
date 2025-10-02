import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();
    const { id } = await context.params;
    const blog = await Blog.findOne({ _id: id, isDeleted: false });
    if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Get blog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();
    const { id } = await context.params;
    const body = await request.json();
    const { title, slug, description, contentHtml, coverImage, tags, status, publishAt, isActive } = body;

    const update: any = {};
    if (title !== undefined) update.title = title;
    if (slug !== undefined) update.slug = slug.toLowerCase();
    if (description !== undefined) update.description = description;
    if (contentHtml !== undefined) {
      update.contentHtml = String(contentHtml).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    }
    if (coverImage !== undefined) update.coverImage = coverImage;
    if (tags !== undefined) update.tags = Array.isArray(tags) ? tags : [];
    if (status !== undefined) update.status = status;
    if (publishAt !== undefined) update.publishAt = publishAt ? new Date(publishAt) : null;
    if (isActive !== undefined) update.isActive = !!isActive;

    // Push current version snapshot before update
    const existing = await Blog.findById(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await Blog.findByIdAndUpdate(id, {
      $push: {
        versions: {
          title: existing.title,
          description: existing.description,
          contentHtml: existing.contentHtml,
          coverImage: existing.coverImage,
          tags: existing.tags || [],
          status: existing.status,
          publishAt: existing.publishAt || null,
          versionAt: new Date(),
        }
      }
    });
    const blog = await Blog.findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true });
    if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Blog updated', blog });
  } catch (error) {
    console.error('Update blog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();
    const { id } = await context.params;
    const deleted = await Blog.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Blog soft-deleted' });
  } catch (error) {
    console.error('Delete blog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


