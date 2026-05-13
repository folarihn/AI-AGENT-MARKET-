import { createPublicClient, http } from 'viem';
import { prisma } from '@/lib/prisma';
import { ARC_CHAIN_ID, ARC_RPC_URL } from '@/lib/wagmi';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

const MARKETPLACE_ABI = [
  {
    name: 'purchaseAgent',
    type: 'function',
    inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
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
  platformFee: bigint;
  royaltyFee: bigint;
  transactionHash: string;
  blockNumber: bigint;
  logIndex: number;
}

async function getLatestBlockNumber(): Promise<bigint> {
  return arcClient.getBlockNumber();
}

async function fetchEvents(fromBlock: bigint, toBlock: bigint): Promise<EventLog[]> {
  if (!MARKETPLACE_ADDRESS) {
    console.warn('MARKETPLACE_ADDRESS not configured');
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
      priceUSDC: (log.args.priceUSDC ?? 0n) as bigint,
      platformFee: (log.args.platformFee ?? 0n) as bigint,
      royaltyFee: (log.args.royaltyFee ?? 0n) as bigint,
      transactionHash: log.transactionHash as string,
      blockNumber: log.blockNumber as bigint,
      logIndex: log.logIndex as number,
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}

async function findOrCreateUserByWallet(walletAddress: string): Promise<string> {
  let user = await prisma.user.findFirst({
    where: { walletAddress: walletAddress.toLowerCase() },
  });

  if (user) {
    return user.id;
  }

  const newUser = await prisma.user.create({
    data: {
      email: `wallet-${walletAddress.toLowerCase().slice(2, 8)}@agenti.local`,
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
  const existingPurchase = await prisma.purchase.findFirst({
    where: { txHash: event.transactionHash },
  });

  if (existingPurchase) {
    console.log(`Event already processed: ${event.transactionHash}`);
    return;
  }

  const agentDbId = await findAgentByAgentId(event.agentId);
  if (!agentDbId) {
    console.warn(`Agent not found for agentId: ${event.agentId}`);
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
      details: `Purchased via Arc - tx: ${event.transactionHash.slice(0, 10)}...`,
      metadata: {
        txHash: event.transactionHash,
        blockNumber: Number(event.blockNumber),
        buyer: event.buyer,
        creator: event.creator,
        priceUSDC: Number(event.priceUSDC),
        platformFee: Number(event.platformFee),
      },
    },
  });

  console.log(`Processed purchase: ${event.transactionHash}`);
}

let lastProcessedBlock = BigInt(0);
let isRunning = false;
let backoffMs = 1000;

async function indexerTick(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const settings = await prisma.settings.findFirst({
      where: { key: 'indexer_last_block' },
    });

    if (settings) {
      lastProcessedBlock = BigInt(settings.value);
    }

    const latestBlock = await getLatestBlockNumber();

    if (latestBlock <= lastProcessedBlock) {
      backoffMs = 1000;
      return;
    }

    const events = await fetchEvents(lastProcessedBlock + 1n, latestBlock);

    for (const event of events) {
      await processEvent(event);
    }

    lastProcessedBlock = latestBlock;

    await prisma.settings.upsert({
      where: { key: 'indexer_last_block' },
      update: { value: String(lastProcessedBlock) },
      create: { key: 'indexer_last_block', value: String(lastProcessedBlock) },
    });
  } catch (error) {
    console.error('Indexer tick error:', error);
    backoffMs = Math.min(backoffMs * 2, 60000);
  } finally {
    isRunning = false;
  }
}

export function startEventIndexer(): () => void {
  console.log('Starting Arc event indexer...');

  const intervalId = setInterval(indexerTick, 30000);

  indexerTick().catch(console.error);

  return () => {
    console.log('Stopping Arc event indexer...');
    clearInterval(intervalId);
  };
}