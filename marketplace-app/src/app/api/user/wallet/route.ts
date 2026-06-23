import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { walletAddress } = body;

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const normalized = walletAddress.toLowerCase();

  // Prevent a wallet from being claimed by more than one account. On-chain NFT
  // licenses are tied to a wallet, so without this a user could bind someone
  // else's wallet and inherit their paid licenses.
  // NOTE: ownership is still only proven via the SIWE login flow; binding here
  // should ideally also require a signed message. A DB unique index on
  // User.walletAddress is recommended as defense-in-depth against races.
  const existing = await prisma.user.findFirst({
    where: { walletAddress: normalized, NOT: { id: session.user.id } },
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
    data: { walletAddress: normalized },
  });

  return NextResponse.json({ walletAddress: user.walletAddress });
}