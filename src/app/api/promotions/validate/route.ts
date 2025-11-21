import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailPromoDiscount from '@/models/EmailPromoDiscount';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
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

    const promo = await EmailPromoDiscount.findOne({ token }).lean();
    if (!promo) {
      console.warn('[PromoValidate] Promo token not found', { token });
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
    }

    const now = new Date();
    if (promo.status === 'expired' || promo.expiresAt < now) {
      if (promo.status !== 'expired') {
        await EmailPromoDiscount.updateOne({ token }, { $set: { status: 'expired' } });
      }
      console.warn('[PromoValidate] Promo token expired', { token, expiresAt: promo.expiresAt });
      return NextResponse.json({ error: 'Promo expired' }, { status: 410 });
    }

    if (requestedProductId && promo.productId.toString() !== requestedProductId) {
      console.warn('[PromoValidate] Promo token product mismatch', {
        token,
        expected: promo.productId.toString(),
        received: requestedProductId,
      });
      return NextResponse.json({ error: 'Promo does not apply to this product' }, { status: 409 });
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

