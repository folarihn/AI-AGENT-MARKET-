import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, decodeEventLog, getAddress, type Hex } from 'viem';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ARC_CHAIN_ID, ARC_RPC_URL, USDC_ADDRESS } from '@/lib/wagmi';

export const runtime = 'nodejs';

const TRANSFER_EVENT = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ],
} as const;

function arcClient() {
  return createPublicClient({
    chain: {
      id: ARC_CHAIN_ID,
      name: 'Arc Testnet',
      nativeCurrency: { decimals: 18, name: 'USDC', symbol: 'USDC' },
      rpcUrls: { default: { http: [ARC_RPC_URL] }, public: { http: [ARC_RPC_URL] } },
    },
    transport: http(ARC_RPC_URL),
  });
}

// USDC ERC-20 interface uses 6 decimals on Arc.
function priceToUnits(price: number): bigint {
  return BigInt(Math.round(price * 1_000_000));
}

// GET → payment details the client needs to build the USDC transfer.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const agent = await db.agents.findById(id);
  if (!agent || agent.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }
  if (agent.price <= 0) {
    return NextResponse.json({ error: 'This agent is free' }, { status: 400 });
  }
  const creator = await prisma.user.findUnique({
    where: { id: agent.creatorId },
    select: { walletAddress: true },
  });
  if (!creator?.walletAddress) {
    return NextResponse.json({ error: 'Creator has not connected a wallet to receive payment' }, { status: 409 });
  }
  return NextResponse.json({
    creatorWallet: creator.walletAddress,
    usdcAddress: USDC_ADDRESS,
    chainId: ARC_CHAIN_ID,
    priceUnits: priceToUnits(agent.price).toString(),
    decimals: 6,
    price: agent.price,
  });
}

// POST { txHash } → verify the transfer happened, then grant the license.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const buyerWallet = (session.user as { walletAddress?: string }).walletAddress;
  if (!buyerWallet) {
    return NextResponse.json(
      { error: 'Connect and verify a wallet (Sign in with wallet) before paying, so the payment can be tied to your account.' },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const txHash = typeof body?.txHash === 'string' ? body.txHash : '';
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 });
  }

  const { id: agentId } = await ctx.params;
  const agent = await db.agents.findById(agentId);
  if (!agent || agent.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }
  if (agent.price <= 0) {
    return NextResponse.json({ error: 'This agent is free — no payment needed' }, { status: 400 });
  }

  // Already owns it?
  const existing = await db.licenses.check(session.user.id, agentId);
  if (existing) {
    return NextResponse.json({ success: true, alreadyOwned: true });
  }

  // Replay guard: a transaction can only be redeemed once.
  const usedTx = await prisma.purchase.findFirst({ where: { txHash }, select: { id: true } });
  if (usedTx) {
    return NextResponse.json({ error: 'This transaction has already been used' }, { status: 409 });
  }

  const creator = await prisma.user.findUnique({
    where: { id: agent.creatorId },
    select: { walletAddress: true },
  });
  if (!creator?.walletAddress) {
    return NextResponse.json({ error: 'Creator has no wallet to receive payment' }, { status: 409 });
  }

  // Verify the on-chain USDC transfer.
  let verified = false;
  try {
    const client = arcClient();
    const receipt = await client.getTransactionReceipt({ hash: txHash as Hex });
    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed on-chain' }, { status: 400 });
    }

    const wantTo = getAddress(creator.walletAddress);
    const wantFrom = getAddress(buyerWallet);
    const wantValue = priceToUnits(agent.price);
    const usdc = getAddress(USDC_ADDRESS);

    for (const log of receipt.logs) {
      if (getAddress(log.address) !== usdc) continue;
      try {
        const decoded = decodeEventLog({ abi: [TRANSFER_EVENT], data: log.data, topics: log.topics });
        if (decoded.eventName !== 'Transfer') continue;
        const { from, to, value } = decoded.args as { from: string; to: string; value: bigint };
        if (getAddress(from) === wantFrom && getAddress(to) === wantTo && value >= wantValue) {
          verified = true;
          break;
        }
      } catch {
        // not a Transfer log; skip
      }
    }
  } catch (err) {
    console.error('Arc purchase verification error:', err);
    return NextResponse.json({ error: 'Could not verify the transaction. Try again in a moment.' }, { status: 502 });
  }

  if (!verified) {
    return NextResponse.json(
      { error: 'No matching USDC payment found in that transaction (wrong amount, recipient, or sender).' },
      { status: 400 }
    );
  }

  // Grant the license + record the purchase atomically.
  await prisma.$transaction(async (tx) => {
    await tx.purchase.create({
      data: {
        userId: session.user.id,
        agentId,
        stripeSessionId: `arc:${txHash}`,
        status: 'COMPLETED',
        amount: new Prisma.Decimal(agent.price),
        txHash,
      },
    });
    await tx.license.upsert({
      where: { userId_agentId: { userId: session.user.id, agentId } },
      update: { pricePaid: new Prisma.Decimal(agent.price) },
      create: { userId: session.user.id, agentId, pricePaid: new Prisma.Decimal(agent.price) },
    });
    await tx.auditLog.create({
      data: {
        agentId,
        action: 'PURCHASE',
        userId: session.user.id,
        details: `Arc USDC purchase verified: ${txHash}`,
        metadata: { txHash, chain: 'arc-testnet' },
      },
    });
  });

  return NextResponse.json({ success: true, txHash });
}
