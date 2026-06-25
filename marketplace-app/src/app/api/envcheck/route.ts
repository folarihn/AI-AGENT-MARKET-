import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TEMPORARY: reports only whether env vars are SET (booleans, never values),
// gated behind a secret key. Remove after use.
const KEY = 'diag-7Qe2mZ9xLp';

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('key') !== KEY) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const has = (n: string) => Boolean(process.env[n]);
  return NextResponse.json({
    storage_R2: {
      R2_ACCOUNT_ID: has('R2_ACCOUNT_ID'),
      R2_ACCESS_KEY_ID: has('R2_ACCESS_KEY_ID'),
      R2_SECRET_ACCESS_KEY: has('R2_SECRET_ACCESS_KEY'),
      R2_BUCKET: has('R2_BUCKET'),
      R2_PUBLIC_URL: has('R2_PUBLIC_URL'),
      R2_ENDPOINT: has('R2_ENDPOINT'),
    },
    payments_stripe: {
      STRIPE_SECRET_KEY: has('STRIPE_SECRET_KEY'),
      STRIPE_WEBHOOK_SECRET: has('STRIPE_WEBHOOK_SECRET'),
    },
    auth: {
      AUTH_SECRET: has('AUTH_SECRET'),
      DATABASE_URL: has('DATABASE_URL'),
      GOOGLE_CLIENT_ID: has('GOOGLE_CLIENT_ID'),
      GOOGLE_CLIENT_SECRET: has('GOOGLE_CLIENT_SECRET'),
    },
    email: {
      RESEND_API_KEY: has('RESEND_API_KEY'),
      RESEND_FROM: has('RESEND_FROM'),
      ADMIN_ALERT_EMAILS: has('ADMIN_ALERT_EMAILS'),
    },
    web3: {
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: has('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'),
      NEXT_PUBLIC_ESCROW_ADDRESS: has('NEXT_PUBLIC_ESCROW_ADDRESS'),
      PLATFORM_PRIVATE_KEY: has('PLATFORM_PRIVATE_KEY'),
    },
    rateLimit_optional: {
      UPSTASH_REDIS_REST_URL: has('UPSTASH_REDIS_REST_URL'),
      KV_REST_API_URL: has('KV_REST_API_URL'),
    },
  });
}
