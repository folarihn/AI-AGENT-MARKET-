import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { rateLimit, getIp } from '@/lib/rateLimit';

const NONCE_EXPIRY_MINUTES = 15;

export async function GET(request: NextRequest) {
  // Unauthenticated endpoint that writes a row per call — rate limit by IP so
  // it can't be used to flood the Nonce table.
  const rl = rateLimit('nonce', getIp(request), { limit: 30, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const nonce = randomUUID();
  const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000);

  await prisma.nonce.create({
    data: {
      nonce,
      expiresAt,
    },
  });

  return NextResponse.json({ nonce });
}