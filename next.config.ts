import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// If deploying to GitHub Pages, default basePath to "/<repo>" when not provided
const inferredRepoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1] ?? '';
const basePath = configuredBasePath || (isGitHubPages && inferredRepoName ? `/${inferredRepoName}` : '');

const nextConfig: NextConfig = {
  // Enable static export when targeting GitHub Pages
  ...(isGitHubPages
    ? {
      output: 'export',
      trailingSlash: true,
      basePath,
      assetPrefix: basePath || undefined,
    }
    : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: {
      resolveAlias: {
        // Prevent file system race conditions
        '~': __dirname,
      },
    },
  },
  images: {
    // Images must be unoptimized for static exports on GitHub Pages
    ...(isGitHubPages ? { unoptimized: true } : {}),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.angeljackets.com',
        port: '',
        pathname: '/**',
      },
      // Optional: user-provided CDN
      ...(process.env.NEXT_PUBLIC_IMAGE_CDN
        ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_IMAGE_CDN.replace(/^https?:\/\//, '').split('/')[0], port: '', pathname: '/**' } as const]
        : []),
    ],
  },
};

export default nextConfig;
