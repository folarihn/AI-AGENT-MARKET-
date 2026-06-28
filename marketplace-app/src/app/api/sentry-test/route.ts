import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TEMPORARY: verifies Sentry is capturing errors in production. Remove after use.
export async function GET() {
  const dsnConfigured = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
  const id = Sentry.captureException(
    new Error('Sentry test error from /api/sentry-test — ' + new Date().toISOString())
  );
  await Sentry.flush(3000);
  return NextResponse.json({ ok: true, dsnConfigured, eventId: id });
}
