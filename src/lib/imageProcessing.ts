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
 * Resize image if too large to speed up processing
 */
async function resizeImageIfNeeded(image: HTMLImageElement, maxDimension: number = 1200): Promise<HTMLImageElement> {
  if (image.width <= maxDimension && image.height <= maxDimension) {
    return image; // No resize needed
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return image;

  // Calculate new dimensions maintaining aspect ratio
  let newWidth = image.width;
  let newHeight = image.height;

  if (image.width > image.height) {
    if (image.width > maxDimension) {
      newWidth = maxDimension;
      newHeight = Math.round((image.height / image.width) * maxDimension);
    }
  } else {
    if (image.height > maxDimension) {
      newHeight = maxDimension;
      newWidth = Math.round((image.width / image.height) * maxDimension);
    }
  }

  canvas.width = newWidth;
  canvas.height = newHeight;
  
  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, newWidth, newHeight);

  // Convert back to image (use JPEG for faster processing, PNG only if transparency needed)
  return new Promise((resolve, reject) => {
    const resizedImg = new Image();
    resizedImg.onload = () => resolve(resizedImg);
    resizedImg.onerror = reject;
    // Use JPEG for faster processing (smaller file, faster background removal)
    resizedImg.src = canvas.toDataURL('image/jpeg', 0.92);
  });
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

  // Resize image if too large to speed up processing (max 1200px on longest side)
  // This significantly reduces processing time for large images (can be 3-5x faster)
  // Only resize if background removal is needed (cropping doesn't need resize)
  if (image instanceof HTMLImageElement && options.removeBackground) {
    image = await resizeImageIfNeeded(image, 1200);
    // Update imageUrl if we resized
    if (image.src.startsWith('data:')) {
      imageUrl = image.src;
    }
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
    // Optimize for speed: use 'small' model by default, 'medium' only when fineEdges is needed
    const config: any = {};
    
    if (bgOptions.fineEdges) {
      // Use medium model for better fine edge detection (slower but better quality)
      // Medium model (~80MB) provides better quality for detailed images
      config.model = 'medium';
      // Use PNG format to preserve transparency and fine details
      config.output = {
        format: 'image/png',
        type: 'foreground'
      };
    } else {
      // Use small model for faster processing (~40MB, faster but may have minor artifacts)
      // Small model is significantly faster while still providing good results
      config.model = 'small';
      config.output = {
        format: 'image/png',
        type: 'foreground'
      };
    }
    
    const blob = await removeBackground(imageUrl, config);
    
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

/**
 * Color detection result
 */
export interface ColorResult {
  hex: string;
  rgb: { r: number; g: number; b: number };
  rgba: { r: number; g: number; b: number; a: number };
  isLight: boolean;
  isDark: boolean;
  name?: string; // Approximate color name
}

/**
 * Background color detection options
 */
export interface BackgroundColorOptions {
  /**
   * Method to detect background color
   * - 'edges': Sample pixels from edges/corners (fast, good for solid backgrounds)
   * - 'corners': Sample only corner pixels (fastest)
   * - 'dominant': Find most common color in entire image (slower, more accurate)
   * - 'smart': Try edges first, fallback to dominant if edges are too varied
   */
  method?: 'edges' | 'corners' | 'dominant' | 'smart';
  /**
   * Edge sampling width in pixels (for 'edges' method)
   */
  edgeWidth?: number;
  /**
   * Number of color clusters to consider (for 'dominant' method)
   */
  colorTolerance?: number;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Calculate luminance to determine if color is light or dark
 */
function getLuminance(r: number, g: number, b: number): number {
  // Relative luminance formula
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Get approximate color name from RGB
 */
function getColorName(r: number, g: number, b: number): string {
  const colors: Array<{ name: string; rgb: [number, number, number] }> = [
    { name: 'White', rgb: [255, 255, 255] },
    { name: 'Black', rgb: [0, 0, 0] },
    { name: 'Red', rgb: [255, 0, 0] },
    { name: 'Green', rgb: [0, 128, 0] },
    { name: 'Blue', rgb: [0, 0, 255] },
    { name: 'Yellow', rgb: [255, 255, 0] },
    { name: 'Orange', rgb: [255, 165, 0] },
    { name: 'Purple', rgb: [128, 0, 128] },
    { name: 'Pink', rgb: [255, 192, 203] },
    { name: 'Brown', rgb: [165, 42, 42] },
    { name: 'Gray', rgb: [128, 128, 128] },
    { name: 'Cream', rgb: [255, 253, 208] },
    { name: 'Beige', rgb: [245, 245, 220] },
  ];

  let minDistance = Infinity;
  let closestColor = 'Unknown';

  for (const color of colors) {
    const distance = Math.sqrt(
      Math.pow(r - color.rgb[0], 2) +
      Math.pow(g - color.rgb[1], 2) +
      Math.pow(b - color.rgb[2], 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.name;
    }
  }

  return closestColor;
}

/**
 * Sample pixels from image edges
 */
function sampleEdgePixels(
  imageData: ImageData,
  width: number,
  height: number,
  edgeWidth: number = 10
): Array<{ r: number; g: number; b: number; a: number }> {
  const pixels: Array<{ r: number; g: number; b: number; a: number }> = [];
  const data = imageData.data;

  // Sample top edge
  for (let y = 0; y < Math.min(edgeWidth, height); y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      });
    }
  }

  // Sample bottom edge
  for (let y = Math.max(0, height - edgeWidth); y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      });
    }
  }

  // Sample left edge
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < Math.min(edgeWidth, width); x++) {
      const idx = (y * width + x) * 4;
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      });
    }
  }

  // Sample right edge
  for (let y = 0; y < height; y++) {
    for (let x = Math.max(0, width - edgeWidth); x < width; x++) {
      const idx = (y * width + x) * 4;
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      });
    }
  }

  return pixels;
}

/**
 * Sample pixels from corners only
 */
function sampleCornerPixels(
  imageData: ImageData,
  width: number,
  height: number,
  cornerSize: number = 20
): Array<{ r: number; g: number; b: number; a: number }> {
  const pixels: Array<{ r: number; g: number; b: number; a: number }> = [];
  const data = imageData.data;
  const size = Math.min(cornerSize, Math.min(width, height) / 2);

  // Top-left corner
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * width + x) * 4;
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      });
    }
  }

  // Top-right corner
  for (let y = 0; y < size; y++) {
    for (let x = Math.max(0, width - size); x < width; x++) {
      const idx = (y * width + x) * 4;
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      });
    }
  }

  // Bottom-left corner
  for (let y = Math.max(0, height - size); y < height; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * width + x) * 4;
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      });
    }
  }

  // Bottom-right corner
  for (let y = Math.max(0, height - size); y < height; y++) {
    for (let x = Math.max(0, width - size); x < width; x++) {
      const idx = (y * width + x) * 4;
      pixels.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      });
    }
  }

  return pixels;
}

/**
 * Find dominant color from pixel array using simple averaging
 */
function getAverageColor(
  pixels: Array<{ r: number; g: number; b: number; a: number }>
): { r: number; g: number; b: number; a: number } {
  if (pixels.length === 0) {
    return { r: 255, g: 255, b: 255, a: 255 };
  }

  let r = 0, g = 0, b = 0, a = 0;
  const count = pixels.length;

  for (const pixel of pixels) {
    r += pixel.r;
    g += pixel.g;
    b += pixel.b;
    a += pixel.a;
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
    a: Math.round(a / count),
  };
}

/**
 * Find the most common color cluster (better for background detection)
 * Groups similar colors together and finds the most frequent cluster
 */
function getDominantColorCluster(
  pixels: Array<{ r: number; g: number; b: number; a: number }>,
  tolerance: number = 30
): { r: number; g: number; b: number; a: number } {
  if (pixels.length === 0) {
    return { r: 255, g: 255, b: 255, a: 255 };
  }

  // Group pixels into color clusters
  const clusters: Array<{ 
    color: { r: number; g: number; b: number; a: number }; 
    count: number;
    pixels: Array<{ r: number; g: number; b: number; a: number }>;
  }> = [];

  for (const pixel of pixels) {
    // Skip transparent or very transparent pixels
    if (pixel.a < 128) continue;

    // Find existing cluster that this pixel belongs to
    let foundCluster = false;
    for (const cluster of clusters) {
      const distance = Math.sqrt(
        Math.pow(pixel.r - cluster.color.r, 2) +
        Math.pow(pixel.g - cluster.color.g, 2) +
        Math.pow(pixel.b - cluster.color.b, 2)
      );

      if (distance <= tolerance) {
        // Add to existing cluster
        cluster.pixels.push(pixel);
        cluster.count++;
        // Update cluster center (running average)
        cluster.color.r = Math.round(
          (cluster.color.r * (cluster.count - 1) + pixel.r) / cluster.count
        );
        cluster.color.g = Math.round(
          (cluster.color.g * (cluster.count - 1) + pixel.g) / cluster.count
        );
        cluster.color.b = Math.round(
          (cluster.color.b * (cluster.count - 1) + pixel.b) / cluster.count
        );
        foundCluster = true;
        break;
      }
    }

    // Create new cluster if no match found
    if (!foundCluster) {
      clusters.push({
        color: { ...pixel },
        count: 1,
        pixels: [pixel]
      });
    }
  }

  if (clusters.length === 0) {
    return getAverageColor(pixels);
  }

  // Find the cluster with the most pixels
  const dominantCluster = clusters.reduce((max, cluster) => 
    cluster.count > max.count ? cluster : max
  );

  return dominantCluster.color;
}

/**
 * Get all pixels from image (for dominant color method)
 */
function getAllPixels(imageData: ImageData): Array<{ r: number; g: number; b: number; a: number }> {
  const pixels: Array<{ r: number; g: number; b: number; a: number }> = [];
  const data = imageData.data;

  // Sample every Nth pixel for performance (e.g., every 10th pixel)
  const step = 10;
  for (let i = 0; i < data.length; i += 4 * step) {
    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3],
    });
  }

  return pixels;
}

/**
 * Detect background color of an image using free client-side code
 * 
 * @param imageSource - Image URL, File, or Blob
 * @param options - Detection options
 * @returns Color result with hex, rgb, and other properties
 * 
 * @example
 * ```typescript
 * const color = await detectBackgroundColor('https://example.com/image.jpg');
 * console.log(color.hex); // '#ffffff'
 * console.log(color.rgb); // { r: 255, g: 255, b: 255 }
 * ```
 */
export async function detectBackgroundColor(
  imageSource: File | Blob | string,
  options: BackgroundColorOptions = {}
): Promise<ColorResult> {
  const {
    method = 'smart',
    edgeWidth = 10,
  } = options;

  // Load image
  let image: HTMLImageElement;
  if (typeof imageSource === 'string') {
    image = await loadImage(imageSource);
  } else {
    const url = URL.createObjectURL(imageSource);
    image = await loadImage(url);
    URL.revokeObjectURL(url);
  }

  // Create canvas and draw image
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let pixels: Array<{ r: number; g: number; b: number; a: number }>;
  let avgColor: { r: number; g: number; b: number; a: number };

  // Choose detection method
  if (method === 'corners') {
    pixels = sampleCornerPixels(imageData, canvas.width, canvas.height, 30);
    // Use clustering for corners to find most common background color
    avgColor = getDominantColorCluster(pixels, 25);
  } else if (method === 'edges') {
    pixels = sampleEdgePixels(imageData, canvas.width, canvas.height, edgeWidth);
    // Use clustering for edges
    avgColor = getDominantColorCluster(pixels, 30);
  } else if (method === 'dominant') {
    pixels = getAllPixels(imageData);
    // Use clustering for dominant color detection
    avgColor = getDominantColorCluster(pixels, 40);
  } else {
    // 'smart' method: try corners first (most likely to be background)
    // then check consistency, fallback to edges or dominant if needed
    pixels = sampleCornerPixels(imageData, canvas.width, canvas.height, 30);
    
    if (pixels.length > 0) {
      // Use clustering to find most common color in corners
      const cornerColor = getDominantColorCluster(pixels, 25);
      
      // Check if corners are consistent (low variance)
      let variance = 0;
      let matchingPixels = 0;
      for (const pixel of pixels) {
        const distance = Math.sqrt(
          Math.pow(pixel.r - cornerColor.r, 2) +
          Math.pow(pixel.g - cornerColor.g, 2) +
          Math.pow(pixel.b - cornerColor.b, 2)
        );
        variance += distance;
        if (distance <= 30) {
          matchingPixels++;
        }
      }
      variance = variance / pixels.length;
      const consistency = matchingPixels / pixels.length;

      // If corners are consistent (60%+ match), use corner color
      // Otherwise try edges, then fallback to dominant
      if (consistency >= 0.6 && variance < 50) {
        avgColor = cornerColor;
      } else {
        // Try edges with clustering
        pixels = sampleEdgePixels(imageData, canvas.width, canvas.height, edgeWidth);
        const edgeColor = getDominantColorCluster(pixels, 30);
        
        // Check edge consistency
        let edgeVariance = 0;
        let edgeMatching = 0;
        for (const pixel of pixels) {
          const distance = Math.sqrt(
            Math.pow(pixel.r - edgeColor.r, 2) +
            Math.pow(pixel.g - edgeColor.g, 2) +
            Math.pow(pixel.b - edgeColor.b, 2)
          );
          edgeVariance += distance;
          if (distance <= 35) {
            edgeMatching++;
          }
        }
        edgeVariance = edgeVariance / pixels.length;
        const edgeConsistency = edgeMatching / pixels.length;

        if (edgeConsistency >= 0.5 && edgeVariance < 60) {
          avgColor = edgeColor;
        } else {
          // Fallback to dominant color from entire image
          pixels = getAllPixels(imageData);
          avgColor = getDominantColorCluster(pixels, 40);
        }
      }
    } else {
      // Fallback if no pixels sampled
      pixels = getAllPixels(imageData);
      avgColor = getDominantColorCluster(pixels, 40);
    }
  }

  const { r, g, b, a } = avgColor;
  const luminance = getLuminance(r, g, b);
  const isLight = luminance > 0.5;
  const isDark = luminance < 0.3;

  return {
    hex: rgbToHex(r, g, b),
    rgb: { r, g, b },
    rgba: { r, g, b, a },
    isLight,
    isDark,
    name: getColorName(r, g, b),
  };
}