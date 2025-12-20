/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 100)
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string, maxLength: number = 100): string {
  if (!text) return '';
  
  return text
    .normalize('NFKD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .toLowerCase()
    .substring(0, maxLength) // Limit length
    .replace(/-$/, ''); // Remove trailing hyphen if truncated
}

/**
 * Generate a unique slug by appending a number if the slug already exists
 * @param baseSlug - The base slug to make unique
 * @param checkExists - Function to check if slug exists
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}
