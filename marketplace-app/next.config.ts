import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: [
    'jszip',
    'bcryptjs',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'viem',
    'siwe',
    'prisma',
    '@prisma/client',
  ],
  turbopack: {},
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Apply baseline security headers to every response.
        source: '/:path*',
        headers: [
          // Stop the site being framed (clickjacking).
          { key: 'X-Frame-Options', value: 'DENY' },
          // Don't let browsers MIME-sniff responses into a different type.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak full URLs to third-party origins.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Lock down powerful browser features we don't use.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Force HTTPS for two years, including subdomains.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
