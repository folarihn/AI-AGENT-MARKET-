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
};

export default nextConfig;
