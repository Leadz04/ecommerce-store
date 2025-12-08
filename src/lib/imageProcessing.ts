/**
 * Image Processing Utilities
 * Provides functions for automated cropping and background removal
 */

import { removeBackground } from '@imgly/background-removal';
import smartcrop from 'smartcrop';

export interface CropOptions {
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface BackgroundRemovalOptions {
  fineEdges?: boolean;
  backgroundColor?: string; // Hex color for replacement
}

export interface ProcessImageOptions {
  crop?: CropOptions;
  removeBackground?: boolean | BackgroundRemovalOptions;
  method?: 'cloudinary' | 'client-side';
}

/**
 * Process image using client-side libraries
 */
export async function processImageClientSide(
  imageSource: File | Blob | string,
  options: ProcessImageOptions
): Promise<Blob> {
  let image: HTMLImageElement | ImageBitmap;
  let imageUrl: string;

  // Convert source to image element
  if (typeof imageSource === 'string') {
    imageUrl = imageSource;
    image = await loadImage(imageUrl);
  } else {
    imageUrl = URL.createObjectURL(imageSource);
    image = await loadImage(imageUrl);
  }

  let processedImage = image;

  // Step 1: Crop if requested
  if (options.crop) {
    const cropped = await cropImage(image, options.crop);
    processedImage = cropped;
    // Clean up old URL if we created one
    if (typeof imageSource !== 'string') {
      URL.revokeObjectURL(imageUrl);
    }
    imageUrl = URL.createObjectURL(await imageToBlob(cropped));
  }

  // Step 2: Remove background if requested
  if (options.removeBackground) {
    const bgOptions = typeof options.removeBackground === 'object' 
      ? options.removeBackground 
      : {};
    
    // Use @imgly/background-removal
    const blob = await removeBackground(imageUrl);
    
    // If background color replacement is requested
    if (bgOptions.backgroundColor) {
      const canvas = await blobToCanvas(blob);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create new canvas with background color
        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        const newCtx = newCanvas.getContext('2d');
        if (newCtx) {
          newCtx.fillStyle = bgOptions.backgroundColor;
          newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
          newCtx.drawImage(canvas, 0, 0);
          return new Promise((resolve) => {
            newCanvas.toBlob((b) => resolve(b || blob), 'image/png');
          });
        }
      }
    }
    
    return blob;
  }

  // Convert final image to blob
  if (processedImage !== image) {
    return imageToBlob(processedImage);
  }

  // If no processing, return original as blob
  if (typeof imageSource === 'string') {
    const response = await fetch(imageSource);
    return await response.blob();
  }
  
  return imageSource;
}

/**
 * Load image from URL or blob
 */
function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = source;
  });
}

/**
 * Crop image using smartcrop.js
 */
async function cropImage(
  image: HTMLImageElement | ImageBitmap,
  options: CropOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Convert ImageBitmap to Image if needed
  let imgElement: HTMLImageElement;
  if (image instanceof ImageBitmap) {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    imgElement = await imageBitmapToImage(image);
  } else {
    imgElement = image;
  }

  // Use smartcrop to find best crop
  const result = await smartcrop.crop(imgElement, {
    width: options.width,
    height: options.height,
  });

  // Create cropped canvas
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = options.width;
  cropCanvas.height = options.height;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('Could not get crop canvas context');

  // Draw cropped portion
  cropCtx.drawImage(
    imgElement,
    result.topCrop.x,
    result.topCrop.y,
    result.topCrop.width,
    result.topCrop.height,
    0,
    0,
    options.width,
    options.height
  );

  return cropCanvas;
}

/**
 * Convert image to blob
 */
function imageToBlob(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (image instanceof HTMLCanvasElement) {
      image.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      }, 'image/png');
    } else if (image instanceof ImageBitmap) {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert image to blob'));
        }, 'image/png');
      } else {
        reject(new Error('Could not get canvas context'));
      }
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert image to blob'));
        }, 'image/png');
      } else {
        reject(new Error('Could not get canvas context'));
      }
    }
  });
}

/**
 * Convert ImageBitmap to Image
 */
function imageBitmapToImage(bitmap: ImageBitmap): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    ctx.drawImage(bitmap, 0, 0);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL();
  });
}

/**
 * Convert blob to canvas
 */
function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Generate Cloudinary transformation URL
 */
export function generateCloudinaryTransformUrl(
  imageUrl: string,
  options: ProcessImageOptions
): string {
  const transformations: string[] = [];

  // Add crop transformation
  if (options.crop) {
    transformations.push(
      `c_fill,w_${options.crop.width},h_${options.crop.height},g_auto`
    );
  }

  // Add background removal
  if (options.removeBackground) {
    const bgOptions = typeof options.removeBackground === 'object' 
      ? options.removeBackground 
      : {};
    
    if (bgOptions.fineEdges) {
      transformations.push('e_background_removal:fineedges');
    } else {
      transformations.push('e_background_removal');
    }

    // Add background color if specified
    if (bgOptions.backgroundColor) {
      const color = bgOptions.backgroundColor.replace('#', '');
      transformations.push(`b_auto:predominant`); // or use `b_${color}` for solid color
    }
  }

  if (transformations.length === 0) {
    return imageUrl;
  }

  // Check if URL is already a Cloudinary URL
  if (imageUrl.includes('cloudinary.com')) {
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/${transformations.join(',')}/${urlParts[1]}`;
    }
  }

  // For non-Cloudinary URLs, we'd need to upload first
  return imageUrl;
}
