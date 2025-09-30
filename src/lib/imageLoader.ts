import type { ImageLoaderProps } from 'next/image';

// CDN-aware loader. If NEXT_PUBLIC_IMAGE_CDN is set, rewrite to that origin.
const cdnOrigin = process.env.NEXT_PUBLIC_IMAGE_CDN?.replace(/\/$/, '');

export function cdnImageLoader({ src, width, quality }: ImageLoaderProps) {
  const q = quality || 75;
  // If already absolute URL and CDN specified, proxy through CDN with width param
  if (cdnOrigin) {
    // Preserve protocol-less or full URLs; strip origin if same-origin
    if (src.startsWith('http')) {
      const encoded = encodeURIComponent(src);
      return `${cdnOrigin}/_next/image?url=${encoded}&w=${width}&q=${q}`;
    }
    // App assets
    return `${cdnOrigin}${src}?w=${width}&q=${q}`;
  }
  // Fallback to default behavior (Next will handle)
  return `${src}?w=${width}&q=${q}`;
}


