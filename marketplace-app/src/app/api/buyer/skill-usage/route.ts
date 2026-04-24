import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createPublicClient, http } from 'viem';
import { ARC_CHAIN_ID, ARC_RPC_URL } from '@/lib/wagmi';

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;

const ESCROW_ABI = [
  {
    name: 'getBalance',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'skillId', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
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

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const walletAddress = (session.user as { walletAddress?: string }).walletAddress;
  if (!walletAddress) {
    return NextResponse.json({ error: 'No wallet connected' }, { status: 400 });
  }

  const currentPeriod = new Date().toISOString().slice(0, 7);

  const skillUsages = await prisma.skillUsage.findMany({
    where: {
      userId: session.user.id,
      period: currentPeriod,
    },
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          slug: true,
          pricePerCall: true,
        },
      },
    },
  });

  const usagePayments = await prisma.usagePayment.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  let totalUsdcSpent = 0;
  let totalCalls = 0;

  const skillsWithLiveBalance = await Promise.all(
    skillUsages.map(async (usage) => {
      const pricePerCall = Number(usage.usdcSpent) > 0 && usage.callCount > 0
        ? Number(usage.usdcSpent) / usage.callCount
        : 0;

      let liveBalance = 0n;
      if (ESCROW_ADDRESS && walletAddress) {
        try {
          liveBalance = await arcClient.readContract({
            address: ESCROW_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: 'getBalance',
            args: [walletAddress as `0x${string}`, usage.skillId as `0x${string}`],
          });
        } catch {
          liveBalance = 0n;
        }
      }

      const usdcRemaining = Number(liveBalance) / 1_000_000;
      const estimatedCallsRemaining = pricePerCall > 0 ? usdcRemaining / pricePerCall : 0;

      totalUsdcSpent += Number(usage.usdcSpent);
      totalCalls += usage.callCount;

      return {
        skillId: usage.skillId,
        skillName: usage.skill.name,
        skillSlug: usage.skill.slug,
        callsThisMonth: usage.callCount,
        usdcSpent: Number(usage.usdcSpent),
        usdcDeposited: Number(usage.usdcSpent) + usdcRemaining,
        usdcRemaining,
        pricePerCall,
        estimatedCallsRemaining: Math.floor(estimatedCallsRemaining),
      };
    })
  );

  const transactions = usagePayments.map((payment) => ({
    id: payment.id,
    skillId: payment.skillId,
    callCount: payment.callCount,
    totalUSDC: Number(payment.totalUSDC),
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
  }));

  return NextResponse.json({
    skills: skillsWithLiveBalance,
    totalUsdcSpent,
    totalCallsThisMonth: totalCalls,
    transactions,
  });
}