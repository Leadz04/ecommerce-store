import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Import all models to ensure proper schema registration
import { Order, Product, OrderCounter } from '@/models';
import EmailPromoDiscount from '@/models/EmailPromoDiscount';
import User from '@/models/User';
import EmailTracking from '@/models/EmailTracking';
import EmailSubscriber from '@/models/EmailSubscriber';
import { applyDeduplication } from '@/lib/deduplication';

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

// Helper function to generate order number with date/time and incremental counter
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  
  // Get or create counter for today
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  let counter = await OrderCounter.findOneAndUpdate(
    { date: today },
    { $inc: { counter: 1 } },
    { upsert: true, new: true }
  );
  
  // Format: YYYYMMDD-HHMMSS-XXXX (where XXXX is the incremental counter)
  const orderNumber = `${dateStr}-${timeStr}-${String(counter.counter).padStart(4, '0')}`;
  
  return orderNumber;
}

export async function GET(request: NextRequest) {
  console.log('[API /orders] GET request received');
  try {
    console.log('[API /orders] Connecting to database...');
    await connectDB();
    console.log('[API /orders] Database connected');
    
    const userId = await verifyToken(request);
    console.log('[API /orders] Fetching orders for user:', userId);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateRange = searchParams.get('dateRange');

    // Build query
    const query: any = { userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }
    
    if (dateRange && dateRange !== 'all') {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query.createdAt = { $gte: startDate };
    }

    // Execute query
    console.log('[API /orders] Executing query:', JSON.stringify(query));
    const ordersRaw = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    console.log('[API /orders] Found', ordersRaw.length, 'orders (before deduplication)');
    
    // Apply deduplication to ensure unique orders
    const orders = applyDeduplication(ordersRaw, 'orders');
    console.log('[API /orders] After deduplication:', orders.length, 'orders');

    const total = await Order.countDocuments(query);
    console.log('[API /orders] Total order count:', total);

    console.log('✅ [API /orders] Success - Returning', orders.length, 'orders');
    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ [API /orders] Error:', error);
    if (error instanceof Error) {
      console.error('[API /orders] Error message:', error.message);
      console.error('[API /orders] Error stack:', error.stack);
    }
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = await verifyToken(request);
    const orderData = await request.json();
    
    // Debug: Log the received order data
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Validate order data
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    let recalculatedSubtotal = 0;

    // Check product availability and update stock
    for (const item of orderData.items) {
      let product;
      
      // Handle both ObjectId and string ID formats
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        // Valid ObjectId - search by _id
        product = await Product.findById(item.productId);
      } else {
        // String ID - search by id field
        product = await Product.findOne({ id: item.productId });
      }
      
      if (product) {
        if (!product.inStock || product.stockCount < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${item.name}` },
            { status: 400 }
          );
        }
      } else {
        console.warn(`Product ${item.name} (ID: ${item.productId}) not found in database. Skipping stock validation.`);
      }
      
      let effectivePrice = product ? product.price : item.price;

      if (item.promoToken && product) {
        try {
          const promoRecord = await EmailPromoDiscount.findOne({ token: item.promoToken });
          if (!promoRecord) {
            console.warn('[Order Promo] Token not found, ignoring', { token: item.promoToken });
            item.promoToken = undefined;
            item.promoPercent = undefined;
          } else if (promoRecord.expiresAt < new Date() || promoRecord.status === 'expired') {
            console.warn('[Order Promo] Token expired', { token: item.promoToken });
            await EmailPromoDiscount.updateOne({ token: item.promoToken }, { $set: { status: 'expired' } });
            item.promoToken = undefined;
            item.promoPercent = undefined;
          } else if (product && promoRecord.productId.toString() !== product._id.toString()) {
            console.warn('[Order Promo] Token product mismatch', {
              token: item.promoToken,
              expected: promoRecord.productId.toString(),
              received: product._id.toString(),
            });
            item.promoToken = undefined;
            item.promoPercent = undefined;
          } else if (product) {
            effectivePrice = Number(
              (product.price * (1 - promoRecord.discountPercent / 100)).toFixed(2)
            );
            item.promoPercent = promoRecord.discountPercent;
            item.promoOriginalPrice = product.price;
            await EmailPromoDiscount.updateOne(
              { token: item.promoToken },
              { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
            );
            console.info('[Order Promo] Promo applied', {
              token: item.promoToken,
              productId: product._id.toString(),
              discountedPrice: effectivePrice,
            });
          }
        } catch (promoError) {
          console.error('[Order Promo] Error validating promo token', promoError);
          item.promoToken = undefined;
          item.promoPercent = undefined;
        }
      }

      item.price = effectivePrice;
      recalculatedSubtotal += effectivePrice * item.quantity;

      if (product) {
        // Update stock
        product.stockCount -= item.quantity;
        if (product.stockCount === 0) {
          product.inStock = false;
        }
        await product.save();
      }
    }

    const recalculatedShipping = recalculatedSubtotal > 100 ? 0 : 9.99;
    const recalculatedTax = Number((recalculatedSubtotal * 0.08).toFixed(2));
    const recalculatedTotal = Number((recalculatedSubtotal + recalculatedShipping + recalculatedTax).toFixed(2));

    orderData.subtotal = recalculatedSubtotal;
    orderData.shipping = recalculatedShipping;
    orderData.tax = recalculatedTax;
    orderData.total = recalculatedTotal;

    console.info('[Order Totals] Recalculated amounts', {
      subtotal: recalculatedSubtotal,
      shipping: recalculatedShipping,
      tax: recalculatedTax,
      total: recalculatedTotal,
    });

    // Debug: Log the Order schema paths
    console.log('Order schema paths:', Object.keys(Order.schema.paths));
    console.log('Address schema paths:', Object.keys(Order.schema.paths.shippingAddress.schema.paths));
    
    // Check if the schema still has the old 'street' field
    const addressSchemaPaths = Object.keys(Order.schema.paths.shippingAddress.schema.paths);
    console.log('Address schema has street field:', addressSchemaPaths.includes('street'));
    console.log('Address schema has address1 field:', addressSchemaPaths.includes('address1'));
    
    // Generate order number with date/time and incremental counter
    const orderNumber = await generateOrderNumber();
    
    // Create order with field mapping for backward compatibility
    const orderDataWithMapping = {
      ...orderData,
      userId,
      orderNumber,
      // Map address fields for backward compatibility
      shippingAddress: {
        ...orderData.shippingAddress,
        // If schema still expects 'street', map address1 to street
        ...(addressSchemaPaths.includes('street') && !addressSchemaPaths.includes('address1') ? {
          street: orderData.shippingAddress.address1
        } : {})
      },
      billingAddress: {
        ...orderData.billingAddress,
        // If schema still expects 'street', map address1 to street
        ...(addressSchemaPaths.includes('street') && !addressSchemaPaths.includes('address1') ? {
          street: orderData.billingAddress.address1
        } : {})
      }
    };
    
    console.log('Final order data with mapping:', JSON.stringify(orderDataWithMapping, null, 2));
    
    const order = new Order(orderDataWithMapping);

    // Attach referral/UTM attribution from headers or cookies forwarded by middleware
    const attribKeys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','aff'];
    const attribution: Record<string, string> = {};
    for (const key of attribKeys) {
      const headerKey = `x-attrib-${key}`;
      const headerVal = request.headers.get(headerKey) as string | null;
      if (headerVal) attribution[key] = headerVal;
    }
    if (Object.keys(attribution).length > 0) {
      // @ts-ignore - extend document with dynamic field without changing schema
      order.set('attribution', attribution, { strict: false });
    }

    // Validate the order before saving
    const validationError = order.validateSync();
    if (validationError) {
      console.error('Order validation error:', validationError);
      console.error('Validation error details:', validationError.errors);
      return NextResponse.json(
        { error: 'Order validation failed', details: validationError.errors },
        { status: 400 }
      );
    }

    await order.save();

    // Track email conversion for this order
    try {
      // Get user email - try multiple sources
      const user = await User.findById(userId).select('email').lean();
      let normalizedEmail: string | null = null;
      
      if (user && user.email) {
        normalizedEmail = user.email.toLowerCase().trim();
      }
      
      // Also check if there's an email in billing address (some orders might have it)
      if (!normalizedEmail && order.billingAddress && (order.billingAddress as any).email) {
        normalizedEmail = ((order.billingAddress as any).email as string).toLowerCase().trim();
      }
      
      if (!normalizedEmail) {
        console.log('[Order Conversion Tracking] No email found for user:', userId);
        // Still continue - conversion tracking is optional
      } else {
        const now = new Date();
        
        // Get product IDs from order items (handle both ObjectId and string formats)
        const productIds: string[] = [];
        const productObjectIds: mongoose.Types.ObjectId[] = [];
        
        for (const item of order.items) {
          if (mongoose.Types.ObjectId.isValid(item.productId)) {
            const objId = new mongoose.Types.ObjectId(item.productId);
            productObjectIds.push(objId);
            productIds.push(item.productId.toString());
            productIds.push(objId.toString());
          } else {
            productIds.push(item.productId);
          }
        }
        
        console.log('[Order Conversion Tracking] Starting conversion tracking', {
          email: normalizedEmail,
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          productIds,
          productObjectIds: productObjectIds.map(id => id.toString()),
          itemCount: order.items.length
        });
        
        // First, let's check what EmailTracking records exist for this email and products
        const existingTracking = await EmailTracking.find({
          email: normalizedEmail,
          emailType: 'promotional',
          'metadata.productId': { $exists: true }
        }).select('metadata.productId metadata.productName converted _id').lean();
        
        console.log('[Order Conversion Tracking] Existing promotional emails found:', {
          count: existingTracking.length,
          records: existingTracking.map(t => ({
            trackingId: t._id.toString(),
            productId: t.metadata?.productId,
            productIdType: typeof t.metadata?.productId,
            productName: t.metadata?.productName,
            converted: t.converted
          }))
        });
        
        // Build comprehensive product ID matching
        // The productId in metadata might be stored as string (from route param) or ObjectId
        const allProductIdVariants: any[] = [];
        
        // Add all string variants
        productIds.forEach(id => {
          allProductIdVariants.push(id);
          allProductIdVariants.push(String(id));
          // If it's an ObjectId string, also try as ObjectId
          if (mongoose.Types.ObjectId.isValid(id)) {
            allProductIdVariants.push(new mongoose.Types.ObjectId(id));
            allProductIdVariants.push(id.toString());
          }
        });
        
        // Add ObjectId variants
        productObjectIds.forEach(objId => {
          allProductIdVariants.push(objId);
          allProductIdVariants.push(objId.toString());
          allProductIdVariants.push(String(objId));
        });
        
        // Remove duplicates
        const uniqueProductIds = [...new Set(allProductIdVariants.map(id => 
          id instanceof mongoose.Types.ObjectId ? id.toString() : String(id)
        ))];
        
        console.log('[Order Conversion Tracking] Product ID variants to match:', {
          original: productIds,
          uniqueVariants: uniqueProductIds,
          count: uniqueProductIds.length
        });
        
        // First, try to match by product ID (most specific)
        let promotionalUpdates = await EmailTracking.updateMany(
          {
            email: normalizedEmail,
            emailType: 'promotional',
            converted: false,
            'metadata.productId': { $in: uniqueProductIds }
          },
          {
            $set: {
              converted: true,
              convertedAt: now,
              orderId: order._id.toString()
            }
          }
        );
        
        console.log('[Order Conversion Tracking] Promotional emails updated (by product ID):', {
          matched: promotionalUpdates.matchedCount,
          modified: promotionalUpdates.modifiedCount
        });
        
        // If no matches, try updating ALL promotional emails for this email
        // This is a fallback in case product ID format doesn't match exactly
        if (promotionalUpdates.matchedCount === 0) {
          console.log('[Order Conversion Tracking] No matches with product IDs, trying all promotional emails for this email');
          promotionalUpdates = await EmailTracking.updateMany(
            {
              email: normalizedEmail,
              emailType: 'promotional',
              converted: false
            },
            {
              $set: {
                converted: true,
                convertedAt: now,
                orderId: order._id.toString()
              }
            }
          );
          console.log('[Order Conversion Tracking] Fallback update (all promotional):', {
            matched: promotionalUpdates.matchedCount,
            modified: promotionalUpdates.modifiedCount
          });
        }
        
        // Also update any other EmailTracking records for this email that haven't been converted
        // This catches cases where they came from welcome/return/urgent emails
        const otherEmailUpdates = await EmailTracking.updateMany(
          {
            email: normalizedEmail,
            converted: false,
            emailType: { $ne: 'promotional' } // Don't double-count promotional emails
          },
          {
            $set: {
              converted: true,
              convertedAt: now,
              orderId: order._id.toString()
            }
          }
        );
        
        console.log('[Order Conversion Tracking] Other emails updated:', {
          matched: otherEmailUpdates.matchedCount,
          modified: otherEmailUpdates.modifiedCount
        });
        
        // Update EmailSubscriber if exists
        await EmailSubscriber.findOneAndUpdate(
          { email: normalizedEmail },
          {
            $set: {
              converted: true,
              conversionDate: now
            }
          },
          { upsert: false }
        );
        
        console.log('[Order Conversion Tracking] Conversion tracking completed for:', normalizedEmail);
      }
    } catch (conversionError) {
      // Don't fail order creation if conversion tracking fails
      console.error('[Order Conversion Tracking] Error:', conversionError);
      console.error('[Order Conversion Tracking] Error stack:', (conversionError as Error).stack);
    }

    // Fire server-side analytics purchase event (without blocking)
    try {
      fetch(process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/analytics/events` : 'http://localhost:3000/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'purchase', orderId: order._id, userId, value: order.total, currency: 'USD' })
      }).catch(() => {});
    } catch {}

    console.log('Order saved successfully:', {
      _id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      total: order.total
    });

    return NextResponse.json({
      message: 'Order created successfully',
      order
    }, { status: 201 });

  } catch (error) {
    console.error('Order creation error:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
