import type { NextAuthConfig } from 'next-auth';

type AppUserRole = 'BUYER' | 'CREATOR' | 'ADMIN';

/**
 * Edge-safe base auth config.
 *
 * This file must NOT import Prisma, bcryptjs, siwe, or any other Node-only
 * package, because it is consumed by `middleware.ts`, which runs on the Edge
 * runtime. Pulling Prisma in here bundles its ~2.2MB query-engine WASM into the
 * middleware edge function and pushes it over Vercel's 1MB edge size limit,
 * which makes deployments fail at the "Deploying outputs" step.
 *
 * The database adapter and the credential providers (which need Prisma/bcrypt/
 * siwe) live in `src/auth.ts`, which only runs on the Node runtime.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  // Providers are added in `src/auth.ts`. The middleware instance only reads an
  // existing JWT session, so it does not need any providers.
  providers: [],
  callbacks: {
    // Edge-safe: reads the JWT only, no database access.
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        const role = (token as unknown as { role?: AppUserRole }).role ?? 'BUYER';
        session.user.role = role;
        (session.user as unknown as { walletAddress?: string }).walletAddress = (
          token as unknown as { walletAddress?: string }
        ).walletAddress;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
