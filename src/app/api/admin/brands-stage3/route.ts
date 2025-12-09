import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  brand: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true
});

let mainConnection: mongoose.Connection | null = null;

async function getMainConnection() {
  if (mainConnection && mainConnection.readyState === 1) {
    return mainConnection;
  }

  const mongooseInstance = await connectDB();
  if (!mongooseInstance) {
    throw new Error('MONGODB_URI is not configured');
  }
  
  mainConnection = mongooseInstance.connection;
  return mainConnection;
}

// GET /api/admin/brands-stage3 - Get all brands from STAGE3 database with product counts
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    
    const conn = await getMainConnection();
    const Product = conn.model('Product', ProductSchema);

    // Get all distinct brands
    const brands = await Product.distinct('brand');
    const validBrands = brands.filter((b): b is string => Boolean(b) && typeof b === 'string' && b.trim().length > 0);

    // Get product count for each brand
    const brandCounts: Record<string, number> = {};
    for (const brand of validBrands) {
      const count = await Product.countDocuments({ brand: { $regex: new RegExp(`^${brand}$`, 'i') } });
      brandCounts[brand] = count;
    }

    // Sort brands by name
    const sortedBrands = validBrands.sort();

    return NextResponse.json({
      brands: sortedBrands,
      brandCounts
    });

  } catch (error: any) {
    console.error('Brands STAGE3 API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brands' },
      { status: error.message?.includes('permission') ? 403 : 500 }
    );
  }
}

