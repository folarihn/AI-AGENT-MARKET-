import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TEMPORARY diagnostic endpoint. Reveals only the DB host (never credentials)
// and the connection error, and is gated behind a secret key. Remove after use.
const DIAG_KEY = 'diag-7Qe2mZ9xLp';

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('key') !== DIAG_KEY) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const raw = process.env.DATABASE_URL || '';
  let host: string | null = null;
  let port: string | null = null;
  let protocol: string | null = null;
  try {
    if (raw) {
      const u = new URL(raw);
      host = u.hostname;
      port = u.port || null;
      protocol = u.protocol.replace(':', '');
    }
  } catch {
    host = '(unparseable)';
  }

  let canConnect = false;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    canConnect = true;
  } catch (err) {
    dbError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  return NextResponse.json({
    databaseUrlSet: Boolean(raw),
    protocol,
    host,
    port,
    directUrlSet: Boolean(process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL),
    canConnect,
    dbError,
    nodeEnv: process.env.NODE_ENV,
  });
}
