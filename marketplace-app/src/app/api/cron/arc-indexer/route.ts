import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPublicClient, http } from 'viem';
import { ARC_CHAIN_ID, ARC_RPC_URL } from '@/lib/wagmi';

const CRON_SECRET = process.env.CRON_SECRET;
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

const MARKETPLACE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'bytes32' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'creator', type: 'address' },
      { name: 'priceUSDC', type: 'uint256' },
      { name: 'platformFee', type: 'uint256' },
      { name: 'royaltyFee', type: 'uint256' },
    ],
    name: 'AgentPurchased',
    type: 'event',
  },
] as const;

const arcClient = createPublicClient({
  chain: {
    id: ARC_CHAIN_ID,
    name: 'Arc Testnet',
    nativeCurrency: { decimals: 6, name: 'USDC', symbol: 'USDC' },
    rpcUrls: { default: { http: [ARC_RPC_URL] }, public: { http: [ARC_RPC_URL] } },
  },
  transport: http(ARC_RPC_URL),
});

interface EventLog {
  agentId: string;
  buyer: string;
  creator: string;
  priceUSDC: bigint;
  transactionHash: string;
  blockNumber: bigint;
}

const errors: string[] = [];

async function getLatestBlockNumber(): Promise<bigint> {
  return arcClient.getBlockNumber();
}

async function fetchEvents(fromBlock: bigint, toBlock: bigint): Promise<EventLog[]> {
  if (!MARKETPLACE_ADDRESS) {
    errors.push('MARKETPLACE_ADDRESS not configured');
    return [];
  }

  try {
    const logs = await arcClient.getContractEvents({
      address: MARKETPLACE_ADDRESS as `0x${string}`,
      abi: MARKETPLACE_ABI,
      eventName: 'AgentPurchased',
      fromBlock,
      toBlock,
    });

    return logs.map((log) => ({
      agentId: (log.args.agentId as string).toLowerCase(),
      buyer: (log.args.buyer as string).toLowerCase(),
      creator: (log.args.creator as string).toLowerCase(),
      priceUSDC: log.args.priceUSDC,
      transactionHash: log.transactionHash as string,
      blockNumber: log.blockNumber,
    }));
  } catch (error) {
    errors.push(`Failed to fetch events: ${error}`);
    return [];
  }
}

async function findOrCreateUserByWallet(walletAddress: string): Promise<string> {
  let user = await prisma.user.findFirst({
    where: { walletAddress: walletAddress.toLowerCase() },
  });

  if (user) return user.id;

  const newUser = await prisma.user.create({
    data: {
      email: `wallet-${walletAddress.slice(2, 8)}@agenti.local`,
      role: 'BUYER',
      walletAddress: walletAddress.toLowerCase(),
    },
  });

  return newUser.id;
}

async function findAgentByAgentId(agentId: string): Promise<string | null> {
  const normalizedId = agentId.includes('-') ? agentId : agentId;
  const agent = await prisma.agent.findFirst({
    where: {
      OR: [
        { id: normalizedId },
        { id: { startsWith: normalizedId.replace(/^0x/, '') } },
      ],
    },
  });
  return agent?.id ?? null;
}

async function processEvent(event: EventLog): Promise<void> {
  const existing = await prisma.purchase.findFirst({
    where: { txHash: event.transactionHash },
  });

  if (existing) return;

  const agentDbId = await findAgentByAgentId(event.agentId);
  if (!agentDbId) {
    errors.push(`Agent not found: ${event.agentId}`);
    return;
  }

  const userId = await findOrCreateUserByWallet(event.buyer);

  await prisma.purchase.create({
    data: {
      userId,
      agentId: agentDbId,
      stripeSessionId: event.transactionHash,
      status: 'COMPLETED',
      amount: Number(event.priceUSDC) / 1_000_000,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    },
  });

  const existingLicense = await prisma.license.findFirst({
    where: { userId, agentId: agentDbId },
  });

  if (!existingLicense) {
    await prisma.license.create({
      data: {
        userId,
        agentId: agentDbId,
        pricePaid: Number(event.priceUSDC) / 1_000_000,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      agentId: agentDbId,
      action: 'PURCHASE',
      userId,
      details: `Purchased via Arc: ${event.transactionHash.slice(0, 10)}...`,
    },
  });
}

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  errors.length = 0;
  let processed = 0;

  try {
    const settings = await prisma.settings.findFirst({
      where: { key: 'indexer_last_block' },
    });

    let lastBlock = BigInt(0);
    if (settings) {
      lastBlock = BigInt(settings.value);
    }

    const latestBlock = await getLatestBlockNumber();
    if (latestBlock <= lastBlock) {
      return NextResponse.json({ processed: 0, errors: [] });
    }

    const events = await fetchEvents(lastBlock + 1n, latestBlock);

    for (const event of events) {
      await processEvent(event);
      processed++;
    }

    await prisma.settings.upsert({
      where: { key: 'indexer_last_block' },
      update: { value: String(latestBlock) },
      create: { key: 'indexer_last_block', value: String(latestBlock) },
    });

    return NextResponse.json({ processed, errors });
  } catch (error) {
    errors.push(`Index error: ${error}`);
    return NextResponse.json({ processed, errors }, { status: 500 });
  }
}