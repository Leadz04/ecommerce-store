import type { Metadata } from "next";
import { companyInfo } from "@/data/companyInfo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || companyInfo.siteUrl || "http://localhost:3000";

export function getCanonicalUrl(pathname: string = "/"): string {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${siteUrl}${cleanPath}`;
}

export const defaultOpenGraph: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  url: siteUrl,
  siteName: companyInfo.name,
  title: `${companyInfo.name} – ${companyInfo.tagline}`,
  description: companyInfo.description,
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: companyInfo.name,
    },
  ],
  locale: "en_US",
};

export const defaultTwitter: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
  site: "@everstylecrafts",
  creator: "@everstylecrafts",
};

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: companyInfo.name,
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
    name: companyInfo.legalName,
    url: siteUrl,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: companyInfo.email,
      telephone: companyInfo.phone,
      availableLanguage: ["en", "ur"],
    },
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


