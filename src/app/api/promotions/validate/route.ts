import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailPromoDiscount from '@/models/EmailPromoDiscount';
import Coupon from '@/models/Coupon';
import Product from '@/models/Product';
import { checkRateLimit, promoValidationLimiter } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = checkRateLimit(request, promoValidationLimiter);
  if (rateLimitResponse) {
    console.warn('[PromoValidate] Rate limit exceeded');
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const requestedProductId = searchParams.get('productId');

  if (!token) {
    console.warn('[PromoValidate] Missing token parameter');
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    console.info('[PromoValidate] Validating promo token', { token, requestedProductId });
    await connectDB();

    const now = new Date();
    
    // First check general coupons
    const coupon = await Coupon.findOne({ code: token.toUpperCase().trim() }).lean();
    
    if (coupon) {
      // Validate general coupon
      if (!coupon.isActive || coupon.status !== 'active') {
        return NextResponse.json({ error: 'This discount code is not active.' }, { status: 410 });
      }

      if (coupon.startDate > now || coupon.endDate < now) {
        return NextResponse.json({ error: 'This discount code has expired.' }, { status: 410 });
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({ error: 'This discount code has reached its usage limit.' }, { status: 410 });
      }

      // Check product-specific coupon
      if (coupon.productId && requestedProductId && coupon.productId.toString() !== requestedProductId) {
        return NextResponse.json({ error: 'This discount code is only valid for specific products.' }, { status: 409 });
      }

      // Calculate discount
      const discountPercent = coupon.discountType === 'percentage' 
        ? coupon.discountValue 
        : null;
      const discountAmount = coupon.discountType === 'fixed' 
        ? coupon.discountValue 
        : null;

      console.info('[PromoValidate] General coupon validated', {
        token,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      });

      return NextResponse.json({
        success: true,
        promo: {
          token: coupon.code,
          couponId: coupon._id.toString(),
          name: coupon.name,
          discountType: coupon.discountType,
          discountPercent: discountPercent,
          discountAmount: discountAmount,
          productId: coupon.productId?.toString(),
          category: coupon.category,
          minimumPurchase: coupon.minimumPurchase,
          maxDiscountAmount: coupon.maxDiscountAmount,
          expiresAt: coupon.endDate,
          source: 'coupon',
        },
      });
    }

    // Fall back to email promo discount
    const promo = await EmailPromoDiscount.findOne({ token }).lean();
    if (!promo) {
      console.warn('[PromoValidate] Promo token not found', { token });
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
    }

    if (promo.status === 'expired' || promo.expiresAt < now) {
      if (promo.status !== 'expired') {
        await EmailPromoDiscount.updateOne({ token }, { $set: { status: 'expired' } });
      }
      console.warn('[PromoValidate] Promo token expired', { token, expiresAt: promo.expiresAt });
      return NextResponse.json({ error: 'This discount code has expired. Check your email for the latest offers.' }, { status: 410 });
    }

    // Check usage limits
    const maxUsage = promo.maxUsageCount || 1;
    if (promo.usageCount >= maxUsage) {
      console.warn('[PromoValidate] Promo usage limit exceeded', {
        token,
        usageCount: promo.usageCount,
        maxUsageCount: maxUsage
      });
      return NextResponse.json({
        error: 'This discount code has already been used the maximum number of times.'
      }, { status: 410 });
    }

    // Validate email-user binding (get user email from auth header)
    const userEmail = request.headers.get('x-user-email')?.toLowerCase().trim();
    if (userEmail && promo.email !== userEmail) {
      console.warn('[PromoValidate] Email mismatch', {
        token,
        promoEmail: promo.email,
        userEmail,
      });
      return NextResponse.json({
        error: 'This discount code is not valid for your account. Please use the code sent to your email.'
      }, { status: 403 });
    }

    if (requestedProductId && promo.productId.toString() !== requestedProductId) {
      console.warn('[PromoValidate] Promo token product mismatch', {
        token,
        expected: promo.productId.toString(),
        received: requestedProductId,
      });
      return NextResponse.json({ error: 'This discount code is only valid for specific products. Browse our catalog to find more deals!' }, { status: 409 });
    }

    const product = await Product.findById(promo.productId)
      .select('price originalPrice name image')
      .lean();

    if (!product) {
      console.error('[PromoValidate] Product missing for promo token', {
        token,
        productId: promo.productId.toString(),
      });
      return NextResponse.json({ error: 'Product not found for promo' }, { status: 500 });
    }

    const basePrice = product.price;
    const discountedPrice = Number(
      (basePrice * (1 - promo.discountPercent / 100)).toFixed(2)
    );

    console.info('[PromoValidate] Promo token validated', {
      token,
      productId: promo.productId.toString(),
      discountPercent: promo.discountPercent,
      discountedPrice,
    });

    return NextResponse.json({
      success: true,
      promo: {
        token: promo.token,
        productId: promo.productId.toString(),
        productName: product.name,
        discountPercent: promo.discountPercent,
        discountedPrice,
        originalPrice: product.originalPrice || basePrice,
        expiresAt: promo.expiresAt,
        source: 'email',
      },
    });
  } catch (error) {
    console.error('[PromoValidate] Error validating promo token', { token, error });
    return NextResponse.json(
      { error: 'Unable to validate promo token' },
      { status: 500 }
    );
  }
}

