/**
 * Example: Testing Background Color Detection
 * 
 * This file demonstrates how to use the detectBackgroundColor function.
 * You can use this as a reference or test it in your application.
 * 
 * Note: This function works in the browser only (uses Canvas API).
 * For Node.js/server-side, you would need a different implementation.
 */

import { 
  detectBackgroundColor, 
  type ColorResult,
  type BackgroundColorOptions 
} from '@/lib/imageProcessing';

/**
 * Example 1: Detect color from image URL
 */
export async function example1_DetectFromUrl() {
  const imageUrl = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800';
  
  try {
    const color = await detectBackgroundColor(imageUrl);
    
    console.log('=== Background Color Detection Result ===');
    console.log('Hex:', color.hex);
    console.log('RGB:', color.rgb);
    console.log('RGBA:', color.rgba);
    console.log('Is Light:', color.isLight);
    console.log('Is Dark:', color.isDark);
    console.log('Color Name:', color.name);
    
    return color;
  } catch (error) {
    console.error('Error detecting color:', error);
    throw error;
  }
}

/**
 * Example 2: Detect color with different methods
 */
export async function example2_DifferentMethods(imageUrl: string) {
  console.log('Testing different detection methods...\n');
  
  // Method 1: Smart (default)
  const smartColor = await detectBackgroundColor(imageUrl, { method: 'smart' });
  console.log('Smart method:', smartColor.hex);
  
  // Method 2: Corners (fastest)
  const cornersColor = await detectBackgroundColor(imageUrl, { method: 'corners' });
  console.log('Corners method:', cornersColor.hex);
  
  // Method 3: Edges
  const edgesColor = await detectBackgroundColor(imageUrl, { 
    method: 'edges',
    edgeWidth: 15 
  });
  console.log('Edges method:', edgesColor.hex);
  
  // Method 4: Dominant (most accurate)
  const dominantColor = await detectBackgroundColor(imageUrl, { method: 'dominant' });
  console.log('Dominant method:', dominantColor.hex);
  
  return {
    smart: smartColor,
    corners: cornersColor,
    edges: edgesColor,
    dominant: dominantColor
  };
}

/**
 * Example 3: Use detected color for background replacement
 */
export async function example3_UseForBackgroundReplacement(imageUrl: string) {
  // Detect the background color
  const bgColor = await detectBackgroundColor(imageUrl);
  
  console.log('Detected background:', bgColor.hex);
  console.log('Using this color for background replacement...');
  
  // You can now use this color in your image processing
  // For example, with the ImageEditor component:
  // setBgColor(bgColor.hex);
  
  return bgColor;
}

/**
 * Example 4: Determine text color based on background
 */
export async function example4_DetermineTextColor(imageUrl: string) {
  const bgColor = await detectBackgroundColor(imageUrl);
  
  // Choose text color based on background
  const textColor = bgColor.isLight ? '#000000' : '#ffffff';
  const contrastColor = bgColor.isDark ? '#ffffff' : '#000000';
  
  console.log('Background:', bgColor.hex);
  console.log('Recommended text color:', textColor);
  console.log('Contrast color:', contrastColor);
  
  return {
    background: bgColor,
    textColor,
    contrastColor
  };
}

/**
 * Example 5: Batch detect colors for multiple images
 */
export async function example5_BatchDetection(imageUrls: string[]) {
  console.log(`Detecting colors for ${imageUrls.length} images...\n`);
  
  const results = await Promise.all(
    imageUrls.map(async (url, index) => {
      try {
        const color = await detectBackgroundColor(url);
        console.log(`Image ${index + 1}: ${color.hex} (${color.name})`);
        return { url, color };
      } catch (error) {
        console.error(`Error processing image ${index + 1}:`, error);
        return { url, color: null, error };
      }
    })
  );
  
  return results;
}

/**
 * Example 6: React Hook for color detection (for use in React components)
 * 
 * Usage in a React component:
 * ```tsx
 * 'use client';
 * import { useState } from 'react';
 * import { useBackgroundColor } from '@/examples/test-background-color';
 * 
 * export function MyComponent() {
 *   const { color, loading, error, detect } = useBackgroundColor();
 *   
 *   useEffect(() => {
 *     detect('https://example.com/image.jpg');
 *   }, []);
 *   
 *   return <div>Background: {color?.hex}</div>;
 * }
 * ```
 */
export function useBackgroundColor() {
  // This is a TypeScript example - in a real React component, you'd use:
  // const [color, setColor] = useState<ColorResult | null>(null);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<Error | null>(null);
  
  // For this example file, we'll just show the structure:
  return {
    detect: async (imageSource: File | Blob | string, options?: BackgroundColorOptions) => {
      return await detectBackgroundColor(imageSource, options);
    }
  };
}

// Note: To use these examples in a React component:
// 1. Import the function: import { detectBackgroundColor } from '@/lib/imageProcessing';
// 2. Call it in an async function or useEffect
// 3. Handle the result appropriately
//
// Example React component:
// ```tsx
// 'use client';
// import { useState, useEffect } from 'react';
// import { detectBackgroundColor } from '@/lib/imageProcessing';
// 
// export function ColorDetector({ imageUrl }: { imageUrl: string }) {
//   const [color, setColor] = useState(null);
//   const [loading, setLoading] = useState(false);
// 
//   useEffect(() => {
//     setLoading(true);
//     detectBackgroundColor(imageUrl)
//       .then(setColor)
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, [imageUrl]);
// 
//   if (loading) return <div>Detecting...</div>;
//   if (!color) return null;
// 
//   return (
//     <div style={{ backgroundColor: color.hex, padding: '20px' }}>
//       <p>Background: {color.hex}</p>
//       <p>Name: {color.name}</p>
//     </div>
//   );
// }
// ```

