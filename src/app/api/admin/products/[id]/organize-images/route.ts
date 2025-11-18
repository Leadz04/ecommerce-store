import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import cloudinary from 'cloudinary';

// Configure Cloudinary
function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  
  if (cloudinaryUrl) {
    try {
      const url = new URL(cloudinaryUrl);
      return {
        cloud_name: url.hostname,
        api_key: url.username,
        api_secret: url.password,
        secure: true
      };
    } catch (err) {
      console.error('Invalid CLOUDINARY_URL format');
    }
  }
  
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  };
}

function sanitizeFilename(text: string): string {
  if (!text) return 'product';
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'product';
}

async function uploadImageToCloudinary(imageUrl: string, folderPath: string, fileName: string): Promise<string> {
  try {
    // Check if already a Cloudinary URL
    if (imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com')) {
      return imageUrl; // Already on Cloudinary
    }

    const config = getCloudinaryConfig();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error('Missing Cloudinary credentials');
    }

    cloudinary.v2.config(config);

    const result = await cloudinary.v2.uploader.upload(imageUrl, {
      folder: folderPath,
      public_id: fileName,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'jpg' }
      ],
      invalidate: true
    });

    return result.secure_url;
  } catch (error: any) {
    console.error(`Error uploading ${fileName}:`, error.message);
    throw error;
  }
}

// POST /api/admin/products/[id]/organize-images - Organize images for a single product
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_UPDATE)(request);
    await connectDB();

    const { id } = await context.params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate Cloudinary config
    const config = getCloudinaryConfig();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      return NextResponse.json(
        { error: 'Cloudinary credentials not configured. Please set CLOUDINARY_URL or individual credentials in environment variables.' },
        { status: 500 }
      );
    }

    const productName = product.name || 'product';
    const folderName = `EverStyleCrafts/${sanitizeFilename(productName)}`;
    
    // Get all images (main image + images array)
    const allImages: string[] = [];
    if (product.image) allImages.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && !allImages.includes(img)) {
          allImages.push(img);
        }
      });
    }

    if (allImages.length === 0) {
      return NextResponse.json(
        { error: 'No images found for this product' },
        { status: 400 }
      );
    }

    // Upload images to Cloudinary
    const updatedImages: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < allImages.length; i++) {
      const imageUrl = allImages[i];
      if (!imageUrl || !imageUrl.startsWith('http')) {
        updatedImages.push(imageUrl || '');
        continue;
      }

      try {
        const fileName = `${sanitizeFilename(productName)}-view-${i + 1}`;
        const newUrl = await uploadImageToCloudinary(imageUrl, folderName, fileName);
        updatedImages.push(newUrl);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Failed to upload image ${i + 1}:`, error);
        errors.push(`Image ${i + 1}: ${error.message}`);
        updatedImages.push(imageUrl); // Keep original URL on error
      }
    }

    // Update product with new image URLs
    const mainImage = updatedImages[0] || product.image;
    const imagesArray = updatedImages.filter((url, index) => index > 0 || !product.image || url !== product.image);

    product.image = mainImage;
    product.images = imagesArray;

    await product.save();

    return NextResponse.json({
      message: 'Images organized successfully',
      product: {
        _id: product._id,
        name: product.name,
        image: product.image,
        images: product.images,
        folder: folderName
      },
      stats: {
        total: allImages.length,
        uploaded: updatedImages.filter(url => url.includes('cloudinary.com')).length,
        skipped: updatedImages.filter(url => url.includes('cloudinary.com') && allImages.includes(url)).length,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Organize images error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

