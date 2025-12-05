import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';

// GET /api/admin/coupons - Get all coupons with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // 'active', 'expired', 'disabled', or ''
    const discountType = searchParams.get('discountType') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      if (status === 'expired') {
        query.$or = [
          { status: 'expired' },
          { endDate: { $lt: new Date() } },
        ];
      } else {
        query.status = status;
      }
    }

    if (discountType) {
      query.discountType = discountType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Coupon.countDocuments(query);

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch coupons
    const coupons = await Coupon.find(query)
      .populate('productId', 'name image price')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate current status for each coupon (check expiration)
    const now = new Date();
    const couponsWithStatus = coupons.map((coupon: any) => {
      const isExpired = coupon.endDate < now || coupon.status === 'expired';
      const isUsageLimitReached = coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;
      
      let currentStatus = coupon.status;
      if (isExpired && coupon.status !== 'expired') {
        currentStatus = 'expired';
      } else if (isUsageLimitReached && coupon.status !== 'disabled') {
        currentStatus = 'disabled';
      }

      return {
        ...coupon,
        currentStatus,
        isValid: !isExpired && !isUsageLimitReached && coupon.isActive && coupon.status === 'active',
      };
    });

    return NextResponse.json({
      success: true,
      coupons: couponsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create new coupon
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_CREATE)(request);
    await connectDB();

    const body = await request.json();
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minimumPurchase,
      maxDiscountAmount,
      productId,
      category,
      startDate,
      endDate,
      usageLimit,
      usageLimitPerUser,
      isActive = true,
    } = body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Code, discount type, discount value, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Validate discount value
    if (discountType === 'percentage') {
      if (discountValue < 1 || discountValue > 100) {
        return NextResponse.json(
          { error: 'Percentage discount must be between 1 and 100' },
          { status: 400 }
        );
      }
    } else if (discountType === 'fixed') {
      if (discountValue < 0) {
        return NextResponse.json(
          { error: 'Fixed discount amount cannot be negative' },
          { status: 400 }
        );
      }
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'A coupon with this code already exists' },
        { status: 400 }
      );
    }

    // Determine initial status
    const now = new Date();
    let status: 'active' | 'expired' | 'disabled' = 'active';
    if (end < now) {
      status = 'expired';
    } else if (!isActive) {
      status = 'disabled';
    }

    // Create coupon
    const coupon = new Coupon({
      code: code.toUpperCase().trim(),
      name: name?.trim(),
      description: description?.trim(),
      discountType,
      discountValue,
      minimumPurchase,
      maxDiscountAmount,
      productId: productId || undefined,
      category: category || undefined,
      startDate: start,
      endDate: end,
      usageLimit,
      usageLimitPerUser: usageLimitPerUser || 1,
      isActive,
      status,
      usageCount: 0,
      totalDiscountGiven: 0,
      totalRevenue: 0,
    });

    await coupon.save();

    // Audit log
    try {
      await AuditLog.create({
        userId: user._id,
        action: 'CREATE',
        resourceType: 'Coupon',
        resourceId: coupon._id.toString(),
        details: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      coupon,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A coupon with this code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
