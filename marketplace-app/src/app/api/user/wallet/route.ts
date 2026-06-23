import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Bind a wallet to the signed-in account.
 *
 * Ownership MUST be proven with a SIWE signature — otherwise a user could claim
 * any address and inherit that wallet's on-chain NFT licenses (free downloads).
 * The client should fetch a nonce from /api/auth/nonce, build a SIWE message for
 * the connected address, sign it, and POST { message, signature } here.
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const messageStr = typeof body?.message === 'string' ? body.message : '';
  const signature = typeof body?.signature === 'string' ? body.signature : '';

  if (!messageStr || !signature) {
    return NextResponse.json(
      { error: 'A signed SIWE message and signature are required to link a wallet' },
      { status: 400 }
    );
  }

  // Verify the signature proves control of the claimed address.
  let address: string;
  let nonce: string;
  try {
    const message = new SiweMessage(messageStr);
    const { data } = await message.verify({ signature });
    address = data.address.toLowerCase();
    nonce = data.nonce;
  } catch {
    return NextResponse.json({ error: 'Invalid wallet signature' }, { status: 401 });
  }

  // Consume the nonce so a captured signature cannot be replayed.
  const nonceRecord = await prisma.nonce.findUnique({ where: { nonce } });
  if (!nonceRecord || nonceRecord.used || nonceRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 });
  }
  await prisma.nonce.update({ where: { nonce }, data: { used: true } });

  // A wallet may only be linked to one account (on-chain licenses are per-wallet).
  const existing = await prisma.user.findFirst({
    where: { walletAddress: address, NOT: { id: session.user.id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'This wallet is already linked to another account' },
      { status: 409 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { walletAddress: address },
  });

  return NextResponse.json({ walletAddress: user.walletAddress });
}
