import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

const NONCE_EXPIRY_MINUTES = 15;

export async function GET() {
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