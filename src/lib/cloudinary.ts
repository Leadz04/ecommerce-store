import cloudinary from 'cloudinary';

// Configure Cloudinary
export function getCloudinaryConfig() {
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

/**
 * Extract public_id from a Cloudinary URL
 * Handles various Cloudinary URL formats:
 * - https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image-name.jpg
 * - https://res.cloudinary.com/cloud_name/image/upload/folder/image-name.jpg
 * - https://res.cloudinary.com/cloud_name/image/upload/c_scale,w_500/folder/image-name.jpg
 * Returns: folder/image-name
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // Check if it's a Cloudinary URL
  if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
    return null;
  }

  try {
    // Use Cloudinary SDK's utility if available
    if (cloudinary.v2?.utils?.extractPublicId) {
      try {
        const publicId = cloudinary.v2.utils.extractPublicId(url);
        return publicId || null;
      } catch {
        // Fall through to manual extraction
      }
    }

    // Manual extraction using regex
    // Cloudinary URL pattern: .../upload/[version]/[transformations]/[folder/]filename.ext
    // We need to extract everything after /upload/ excluding version and transformations
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Find /upload/ in the path
    const uploadIndex = pathname.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    
    // Get everything after /upload/
    const afterUpload = pathname.substring(uploadIndex + 8); // 8 = length of '/upload/'
    
    // Split by '/' and filter
    const parts = afterUpload.split('/').filter(p => p);
    
    if (parts.length === 0) return null;
    
    // Skip version (v1234567890) and transformations (parts with underscores that look like transformations)
    const publicIdParts: string[] = [];
    let foundNonTransformation = false;
    
    for (const part of parts) {
      // Skip version identifiers
      if (/^v\d+$/.test(part)) {
        continue;
      }
      
      // Check if this looks like a transformation parameter
      // Transformations typically: c_scale, w_500, h_300, etc.
      const looksLikeTransformation = /^[a-z]_[a-z0-9,]+$/i.test(part) && part.length < 100;
      
      if (looksLikeTransformation && !foundNonTransformation) {
        // Skip transformation parameters until we find the actual public_id
        continue;
      }
      
      // Once we find something that doesn't look like a transformation, 
      // everything from here is part of the public_id
      foundNonTransformation = true;
      publicIdParts.push(part);
    }
    
    if (publicIdParts.length === 0) return null;
    
    // Join and remove file extension
    let publicId = publicIdParts.join('/');
    publicId = publicId.replace(/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|tiff)$/i, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
}

/**
 * Delete an image from Cloudinary by URL
 * Returns true if successful, false otherwise
 */
export async function deleteImageFromCloudinary(imageUrl: string): Promise<boolean> {
  try {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (!publicId) {
      console.log('Not a Cloudinary URL or could not extract public_id:', imageUrl);
      return false;
    }

    const config = getCloudinaryConfig();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      console.error('Missing Cloudinary credentials');
      return false;
    }

    cloudinary.v2.config(config);

    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });

    if (result.result === 'ok' || result.result === 'not found') {
      console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
      return true;
    } else {
      console.warn(`Failed to delete image from Cloudinary: ${publicId}`, result);
      return false;
    }
  } catch (error: any) {
    console.error(`Error deleting image from Cloudinary: ${imageUrl}`, error.message);
    return false;
  }
}

/**
 * Delete multiple images from Cloudinary
 * Returns the number of successfully deleted images
 */
export async function deleteImagesFromCloudinary(imageUrls: string[]): Promise<number> {
  if (!imageUrls || imageUrls.length === 0) return 0;

  let deletedCount = 0;
  for (const url of imageUrls) {
    if (await deleteImageFromCloudinary(url)) {
      deletedCount++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return deletedCount;
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

