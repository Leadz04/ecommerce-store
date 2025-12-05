import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';

// GET /api/admin/coupons/[id] - Get single coupon
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    await connectDB();

    const { id } = await context.params;
    const coupon = await Coupon.findById(id).populate('productId', 'name image price').lean();

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Calculate current status
    const now = new Date();
    const isExpired = coupon.endDate < now || coupon.status === 'expired';
    const isUsageLimitReached = coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;
    
    let currentStatus = coupon.status;
    if (isExpired && coupon.status !== 'expired') {
      currentStatus = 'expired';
    } else if (isUsageLimitReached && coupon.status !== 'disabled') {
      currentStatus = 'disabled';
    }

    return NextResponse.json({
      success: true,
      coupon: {
        ...coupon,
        currentStatus,
        isValid: !isExpired && !isUsageLimitReached && coupon.isActive && coupon.status === 'active',
      },
    });
  } catch (error: any) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch coupon' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/coupons/[id] - Update coupon
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_UPDATE)(request);
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    const before = coupon.toObject();

    // Update fields
    if (body.code !== undefined) {
      // Check if new code already exists (if different from current)
      if (body.code.toUpperCase().trim() !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code: body.code.toUpperCase().trim() });
        if (existingCoupon) {
          return NextResponse.json(
            { error: 'A coupon with this code already exists' },
            { status: 400 }
          );
        }
        coupon.code = body.code.toUpperCase().trim();
      }
    }
    if (body.name !== undefined) coupon.name = body.name?.trim();
    if (body.description !== undefined) coupon.description = body.description?.trim();
    if (body.discountType !== undefined) coupon.discountType = body.discountType;
    if (body.discountValue !== undefined) {
      // Validate discount value
      if (coupon.discountType === 'percentage' && (body.discountValue < 1 || body.discountValue > 100)) {
        return NextResponse.json(
          { error: 'Percentage discount must be between 1 and 100' },
          { status: 400 }
        );
      }
      coupon.discountValue = body.discountValue;
    }
    if (body.minimumPurchase !== undefined) coupon.minimumPurchase = body.minimumPurchase;
    if (body.maxDiscountAmount !== undefined) coupon.maxDiscountAmount = body.maxDiscountAmount;
    if (body.productId !== undefined) coupon.productId = body.productId || undefined;
    if (body.category !== undefined) coupon.category = body.category || undefined;
    if (body.startDate !== undefined) coupon.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) coupon.endDate = new Date(body.endDate);
    if (body.usageLimit !== undefined) coupon.usageLimit = body.usageLimit;
    if (body.usageLimitPerUser !== undefined) coupon.usageLimitPerUser = body.usageLimitPerUser;
    if (body.isActive !== undefined) coupon.isActive = body.isActive;

    // Validate dates
    if (coupon.startDate >= coupon.endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Update status based on dates and usage
    const now = new Date();
    if (coupon.endDate < now) {
      coupon.status = 'expired';
    } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      coupon.status = 'disabled';
      coupon.isActive = false;
    } else if (!coupon.isActive) {
      coupon.status = 'disabled';
    } else {
      coupon.status = 'active';
    }

    await coupon.save();

    // Audit log
    try {
      await AuditLog.create({
        userId: user._id,
        action: 'UPDATE',
        resourceType: 'Coupon',
        resourceId: coupon._id.toString(),
        details: {
          before,
          after: coupon.toObject(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      coupon,
    });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A coupon with this code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coupons/[id] - Delete coupon
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_DELETE)(request);
    await connectDB();

    const { id } = await context.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    const before = coupon.toObject();
    await coupon.deleteOne();

    // Audit log
    try {
      await AuditLog.create({
        userId: user._id,
        action: 'DELETE',
        resourceType: 'Coupon',
        resourceId: id,
        details: {
          code: before.code,
          discountType: before.discountType,
          discountValue: before.discountValue,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
