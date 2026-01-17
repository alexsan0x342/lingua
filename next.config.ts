/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment (non-Windows only)
  output: process.platform === "win32" ? undefined : "standalone",

  // Windows compatibility settings
  outputFileTracingRoot:
    process.platform === "win32" ? process.cwd() : undefined,

  // External packages for server components
  serverExternalPackages: ["@prisma/client"],

  // Production optimizations - BLAZINGLY FAST MODE
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Turbopack configuration (Next.js 16 default)
  turbopack: {
    // Fix for long Windows paths
    root: process.cwd(),
    rules: {
      // Add custom rules if needed
    },
  },

  // Experimental features for production - MAXIMUM PERFORMANCE
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins:
        process.env.NODE_ENV === "production"
          ? [
              process.env.BETTER_AUTH_URL || "https://yourdomain.com",
              "https://lingua-ly.com",
              "https://www.lingua-ly.com",
            ]
          : ["localhost:3000"],
      // Increase body size limit for video uploads (1GB)
      bodySizeLimit: "1000mb",
    },
    // Optimize package imports - aggressive optimization
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tooltip",
      "date-fns",
      "recharts",
    ],
    // Optimize CSS imports
    optimizeCss: true,
    // Optimize fonts
    optimizeServerReact: true,
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https: blob: data:; connect-src 'self' https://api.stripe.com https://api.arcjet.com https://video.bunnycdn.com https://*.cdn.lingua-ly.com; frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://iframe.mediadelivery.net; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Link",
            value: "<$&>; rel=preload",
          },
        ],
      },
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        hostname: "localhost",
        port: "3000",
        protocol: "http",
      },
      {
        hostname: "avatar.vercel.sh",
        port: "",
        protocol: "https",
      },
      // AWS S3 patterns
      {
        hostname: "*.amazonaws.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "*.s3.amazonaws.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "*.s3.*.amazonaws.com",
        port: "",
        protocol: "https",
      },
      // Bunny CDN Storage - using wildcard to support any b-cdn.net domain
      {
        hostname: "cdn.lingua-ly.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "*.cdn.lingua-ly.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "cdn.*.cdn.lingua-ly.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "lingua.cdn.lingua-ly.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "storage.bunnycdn.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "*.b-cdn.net",
        port: "",
        protocol: "https",
      },
      // Bunny CDN Video Stream - using wildcard to support any vz-*.cdn.lingua-ly.com domain
      {
        hostname: "vz-16b5445d-66b.cdn.lingua-ly.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "vz-*.cdn.lingua-ly.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "iframe.mediadelivery.net",
        port: "",
        protocol: "https",
      },
      // Tigris storage domains
      {
        hostname: "t3.storage.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "*.storage.dev",
        port: "",
        protocol: "https",
      },
      // Add your production domain and Vercel URLs
      ...(process.env.NEXT_PUBLIC_APP_URL
        ? [
            {
              hostname: new URL(process.env.NEXT_PUBLIC_APP_URL).hostname,
              port: "",
              protocol: "https" as const,
            },
          ]
        : []),
      // Vercel deployment URLs
      {
        hostname: "*.vercel.app",
        port: "",
        protocol: "https",
      },
      // Allow current domain for self-referencing API routes
      {
        hostname: "localhost",
        port: "",
        protocol: "https",
      },
    ],
    // Production image optimization settings - BLAZINGLY FAST!
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: process.env.NODE_ENV === "production" ? 31536000 : 60, // 1 year cache!
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Skip optimization for external CDN images to avoid timeouts
    unoptimized: process.env.NODE_ENV === "development",
    loader: "default",
  },

  // Explicitly expose public environment variables
  env: {
    NEXT_PUBLIC_BUNNY_STORAGE_URL: process.env.NEXT_PUBLIC_BUNNY_STORAGE_URL,
    NEXT_PUBLIC_BUNNY_CDN_HOSTNAME: process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME,
  },
};

export default nextConfig;
