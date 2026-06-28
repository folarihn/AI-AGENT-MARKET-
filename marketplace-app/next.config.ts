import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
    // Content-Security-Policy. Kept deliberately permissive for scripts/connections
    // because the wallet stack (RainbowKit / WalletConnect / wagmi) and Next's
    // inline hydration need it; the value here still blocks plugin content,
    // tag-injection base hijacking, and framing. Tighten script-src with a nonce
    // once the app has been verified in a browser.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ');

    return [
      {
        // Never cache auth responses (session/csrf/providers) — a cached session
        // response could otherwise show the wrong (or no) login state.
        source: '/api/auth/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
      {
        // Apply baseline security headers to every response.
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
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

// Wrap with Sentry. Source-map upload only happens when SENTRY_AUTH_TOKEN/ORG/
// PROJECT are set; without them this is a no-op at build time, and runtime error
// capture is gated on the DSN env var in the sentry.*.config files.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
});
