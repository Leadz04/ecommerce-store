import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export function getCanonicalUrl(pathname: string = "/"): string {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${siteUrl}${cleanPath}`;
}

export const defaultOpenGraph: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  url: siteUrl,
  siteName: "ShopEase",
  title: "ShopEase - Your Online Shopping Destination",
  description:
    "Discover amazing products at great prices. Fast shipping, excellent customer service, and quality guaranteed.",
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "ShopEase",
    },
  ],
  locale: "en_US",
};

export const defaultTwitter: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
  site: "@shopease",
  creator: "@shopease",
};

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ShopEase",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ShopEase",
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
  };
}

export function productJsonLd(input: {
  id: string;
  name: string;
  description: string;
  urlPath: string;
  imageUrls: string[];
  sku?: string;
  brand?: string;
  price: number;
  currency: string;
  availability?: "InStock" | "OutOfStock";
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    sku: input.sku,
    brand: input.brand
      ? { "@type": "Brand", name: input.brand }
      : undefined,
    image: input.imageUrls,
    url: getCanonicalUrl(input.urlPath),
    offers: {
      "@type": "Offer",
      priceCurrency: input.currency,
      price: input.price,
      availability: input.availability
        ? `https://schema.org/${input.availability}`
        : undefined,
      url: getCanonicalUrl(input.urlPath),
    },
  };
}


