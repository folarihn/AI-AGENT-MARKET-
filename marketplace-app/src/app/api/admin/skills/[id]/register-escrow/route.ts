import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ARC_CHAIN_ID, ARC_RPC_URL } from '@/lib/wagmi';

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
const PLATFORM_PRIVATE_KEY = process.env.PLATFORM_PRIVATE_KEY;

const ESCROW_ABI = [
  {
    name: 'registerSkill',
    type: 'function',
    inputs: [
      { name: 'skillId', type: 'bytes32' },
      { name: 'creator', type: 'address' },
      { name: 'pricePerCall', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: skillId } = await context.params;
  
  const skill = await prisma.agent.findUnique({
    where: { id: skillId, itemType: 'SKILL', pricingModel: 'PER_CALL' },
  });

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found or not per-call pricing' }, { status: 404 });
  }

  if (!ESCROW_ADDRESS || !PLATFORM_PRIVATE_KEY) {
    return NextResponse.json({ error: 'Escrow not configured' }, { status: 500 });
  }

  try {
    const arcChain = {
      id: ARC_CHAIN_ID,
      name: 'Arc Testnet',
      nativeCurrency: { decimals: 6, name: 'USDC', symbol: 'USDC' },
      rpcUrls: { default: { http: [ARC_RPC_URL] as const }, public: { http: [ARC_RPC_URL] as const } },
    } as const;

    const account = privateKeyToAccount(PLATFORM_PRIVATE_KEY as `0x${string}`);
    const publicClient = createPublicClient({ chain: arcChain, transport: http(ARC_RPC_URL) });
    const walletClient = createWalletClient({ chain: arcChain, transport: http(ARC_RPC_URL), account });

    const pricePerCallRaw = BigInt(Math.round(Number(skill.pricePerCall ?? skill.price) * 1_000_000));
    const creatorAddr = (skill.creatorId ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

    const { request: contractRequest } = await publicClient.simulateContract({
      address: ESCROW_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'registerSkill',
      args: [skillId as `0x${string}`, creatorAddr, pricePerCallRaw],
      account,
    });

    const txHash = await walletClient.writeContract(contractRequest);

    await prisma.auditLog.create({
      data: {
        agentId: skillId,
        action: 'APPROVE',
        userId: session.user.id,
        details: `Retry escrow registration: ${txHash}`,
      },
    });

    return NextResponse.json({ success: true, txHash });
  } catch (error) {
    console.error('Escrow registration retry failed:', error);
    return NextResponse.json(
      { error: 'Registration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}