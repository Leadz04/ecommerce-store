import type { MetadataRoute } from "next";
import { getCanonicalUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getCanonicalUrl("");

  // Add static routes
  const entries: MetadataRoute.Sitemap = [
    { url: base + "/", lastModified: new Date() },
    { url: base + "/products", lastModified: new Date() },
    { url: base + "/categories", lastModified: new Date() },
    { url: base + "/about", lastModified: new Date() },
    { url: base + "/contact", lastModified: new Date() },
  ];

  // Optionally include dynamic product and category pages if available server-side
  // If you want to fetch from DB here, import your models/utilities and query.

  return entries;
}


