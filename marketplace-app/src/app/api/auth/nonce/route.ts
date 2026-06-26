import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { rateLimit, getIp } from '@/lib/rateLimit';

const NONCE_EXPIRY_MINUTES = 15;

export async function GET(request: NextRequest) {
  // Unauthenticated endpoint that writes a row per call — rate limit by IP so
  // it can't be used to flood the Nonce table.
  const rl = await rateLimit('nonce', getIp(request), { limit: 30, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  // SIWE (EIP-4361) requires an alphanumeric nonce of 8+ chars. A raw UUID
  // contains hyphens, which makes the signed message invalid and causes wallet
  // sign-in / linking / payment verification to fail. Strip the hyphens.
  const nonce = randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000);

  await prisma.nonce.create({
    data: {
      nonce,
      expiresAt,
    },
  });

  return NextResponse.json({ nonce });
}