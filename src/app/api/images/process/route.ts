import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface ProcessImageRequest {
  imageUrl?: string;
  file?: string; // base64 encoded
  crop?: {
    width: number;
    height: number;
  };
  removeBackground?: boolean | {
    fineEdges?: boolean;
    backgroundColor?: string;
  };
  method?: 'cloudinary' | 'client-side';
  productName?: string;
  folder?: string;
}

function parseCloudinaryUrl(url?: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const apiKey = u.username;
    const apiSecret = u.password;
    const cloudName = u.hostname;
    return { apiKey, apiSecret, cloudName };
  } catch {
    return null;
  }
}

function sanitizeSlug(text?: string | null) {
  if (!text) return 'product';
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'product';
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessImageRequest = await request.json();
    const { imageUrl, file, crop, removeBackground, method = 'cloudinary', productName, folder } = body;

    if (!imageUrl && !file) {
      return NextResponse.json(
        { error: 'Either imageUrl or file must be provided' },
        { status: 400 }
      );
    }

    const conf = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (!conf?.apiKey || !conf?.apiSecret || !conf?.cloudName) {
      return NextResponse.json(
        { error: 'Invalid or missing CLOUDINARY_URL' },
        { status: 500 }
      );
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: conf.cloudName,
      api_key: conf.apiKey,
      api_secret: conf.apiSecret,
    });

    let imageToProcess: string | Buffer;

    // Handle file upload (base64)
    if (file) {
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
      imageToProcess = Buffer.from(base64Data, 'base64');
    } else if (imageUrl) {
      imageToProcess = imageUrl;
    } else {
      return NextResponse.json(
        { error: 'No image source provided' },
        { status: 400 }
      );
    }

    // Build transformation options
    const transformations: any = {};

    // Add crop transformation
    if (crop) {
      transformations.width = crop.width;
      transformations.height = crop.height;
      transformations.crop = 'fill';
      transformations.gravity = 'auto'; // AI-powered auto crop
    }

    // Add background removal
    if (removeBackground) {
      const bgOptions = typeof removeBackground === 'object' ? removeBackground : {};
      transformations.effect = bgOptions.fineEdges 
        ? 'background_removal:fineedges' 
        : 'background_removal';
      
      // Add background color if specified
      if (bgOptions.backgroundColor) {
        transformations.background = bgOptions.backgroundColor.replace('#', '');
      }
    }

    // Determine folder and public_id
    const productSlug = sanitizeSlug(productName);
    const folderName = folder || `EverStyleCrafts/${productSlug}`;
    const publicId = `${productSlug}-processed-${Date.now()}`;

    // Upload with transformations
    const uploadOptions: any = {
      folder: folderName,
      public_id: publicId,
      ...transformations,
    };

    // If background removal is requested, add it to upload options
    if (removeBackground) {
      uploadOptions.background_removal = 'cloudinary_ai';
    }

    let result;
    if (typeof imageToProcess === 'string') {
      // Upload from URL
      result = await cloudinary.uploader.upload(imageToProcess, uploadOptions);
    } else {
      // Upload from buffer
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          }
        );
        uploadStream.end(imageToProcess);
      });
    }

    if (!result || !result.secure_url) {
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      folder: folderName,
      transformations: {
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error: any) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
