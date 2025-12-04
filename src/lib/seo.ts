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
  faqs?: Array<{ question: string; answer: string }>;
}) {
  const productSchema: any = {
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

  // Add FAQ schema if FAQs are provided
  if (input.faqs && input.faqs.length > 0) {
    productSchema.mainEntity = {
      "@type": "FAQPage",
      mainEntity: input.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  }

  return productSchema;
}

/**
 * Generate FAQPage structured data (JSON-LD) for SEO
 * This can appear in Google search results as rich snippets
 */
export function faqPageJsonLd(input: {
  faqs: Array<{ question: string; answer: string }>;
  urlPath?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: input.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
    ...(input.urlPath && { url: getCanonicalUrl(input.urlPath) }),
  };
}

/**
 * Extract keywords from FAQ questions and answers for SEO meta tags
 */
export function extractKeywordsFromFAQs(faqs: Array<{ question: string; answer: string }>): string[] {
  const keywords = new Set<string>();
  
  faqs.forEach((faq) => {
    // Extract from questions (usually contain key search terms)
    const questionWords = faq.question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !['what', 'how', 'when', 'where', 'which', 'does', 'is', 'are', 'can', 'will', 'the', 'this', 'that'].includes(word));
    
    questionWords.forEach((word) => keywords.add(word));
    
    // Extract from answers (might contain product-specific terms)
    const answerWords = faq.answer
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 4);
    
    // Add significant words from answers
    answerWords.slice(0, 5).forEach((word) => keywords.add(word));
  });
  
  return Array.from(keywords).slice(0, 10); // Return top 10 keywords
}

/**
 * Generate SEO-optimized meta description using FAQ data
 */
export function generateMetaDescriptionFromFAQs(
  productName: string,
  description: string,
  faqs: Array<{ question: string; answer: string }>
): string {
  if (faqs.length === 0) return description;
  
  // Use the most relevant FAQ answer as part of meta description
  const firstFAQ = faqs[0];
  const faqSummary = firstFAQ.answer.substring(0, 100).replace(/\s+/g, ' ').trim();
  
  // Combine product description with FAQ snippet (max 160 chars for SEO)
  const combined = `${description.substring(0, 80)}... ${faqSummary}`;
  return combined.length > 160 ? combined.substring(0, 157) + '...' : combined;
}

/**
 * Generate FAQ-based heading suggestions for SEO content optimization
 */
export function generateFAQHeadings(faqs: Array<{ question: string; answer: string }>): Array<{ question: string; heading: string }> {
  return faqs.map((faq) => ({
    question: faq.question,
    heading: faq.question.replace(/^[Ww]hat\s+is|^[Hh]ow\s+to|^[Ww]hen\s+do|^[Ww]here\s+can/gi, '').trim(),
  }));
}


