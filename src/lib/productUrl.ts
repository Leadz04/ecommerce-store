/**
 * Generate a product URL using slug if available, otherwise fallback to _id
 * @param product - Product object with slug and/or _id
 * @returns Product URL path
 */
export function getProductUrl(product: { slug?: string; _id?: string; id?: string }): string {
  if (product.slug) {
    return `/products/${product.slug}`;
  }
  return `/products/${product._id || product.id}`;
}

/**
 * Generate a brand-products URL using slug if available, otherwise fallback to _id
 * @param product - Product object with slug and/or _id
 * @returns Brand products URL path
 */
export function getBrandProductUrl(product: { slug?: string; _id?: string; id?: string }): string {
  if (product.slug) {
    return `/brand-products/${product.slug}`;
  }
  return `/brand-products/${product._id || product.id}`;
}
