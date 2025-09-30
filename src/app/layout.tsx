import type { Metadata, Viewport } from "next";
import { defaultOpenGraph, defaultTwitter } from "@/lib/seo";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBridge from "@/components/ClientBridge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShopEase - Your Online Shopping Destination",
  description: "Discover amazing products at great prices. Fast shipping, excellent customer service, and quality guaranteed.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: defaultOpenGraph,
  twitter: defaultTwitter,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        {/* Canonical URL */}
        <link rel="canonical" href={(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/'} />
        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ShopEase",
              url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
              logo: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/favicon.ico'
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientBridge>{children}</ClientBridge>
      </body>
    </html>
  );
}
