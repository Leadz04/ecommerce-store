import type { Metadata, Viewport } from "next";
import { defaultOpenGraph, defaultTwitter } from "@/lib/seo";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBridge from "@/components/ClientBridge";
import VisitorEmailTracker from "@/components/VisitorEmailTracker";
import { companyInfo } from "@/data/companyInfo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${companyInfo.name} – ${companyInfo.tagline}`,
  description: companyInfo.description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || companyInfo.siteUrl || "http://localhost:3000"),
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        {/* Canonical URL */}
        <link rel="canonical" href={(process.env.NEXT_PUBLIC_SITE_URL || companyInfo.siteUrl || 'http://localhost:3000') + '/'} />
        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: companyInfo.legalName,
              url: process.env.NEXT_PUBLIC_SITE_URL || companyInfo.siteUrl || 'http://localhost:3000',
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: companyInfo.email,
                telephone: companyInfo.phone,
                areaServed: "PK"
              },
              logo: (process.env.NEXT_PUBLIC_SITE_URL || companyInfo.siteUrl || 'http://localhost:3000') + '/favicon.ico'
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientBridge>
          <VisitorEmailTracker />
          {children}
        </ClientBridge>
      </body>
    </html>
  );
}
