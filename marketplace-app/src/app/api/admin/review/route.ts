import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { agentId, action, reason } = await req.json();

    if (!agentId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { creator: { select: { walletAddress: true } } },
    });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const newStatus = action === 'APPROVE' ? 'PUBLISHED' : 'REJECTED';

    let registrationTxHash: string | null = null;
    let escrowRegistrationFailed = false;

    if (action === 'APPROVE' && agent.itemType === 'SKILL' && agent.pricingModel === 'PER_CALL') {
      if (ESCROW_ADDRESS && PLATFORM_PRIVATE_KEY) {
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

          const pricePerCallRaw = BigInt(Math.round(Number(agent.pricePerCall ?? 0) * 1_000_000));
          const creatorAddress = (agent.creator.walletAddress ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

          const { request } = await publicClient.simulateContract({
            address: ESCROW_ADDRESS as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: 'registerSkill',
            args: [agentId as `0x${string}`, creatorAddress, pricePerCallRaw],
            account,
          });

          const hash = await walletClient.writeContract(request);
          registrationTxHash = hash;
          console.log('Skill registered in escrow:', hash);
        } catch (error) {
          console.error('Escrow registration failed:', error);
          escrowRegistrationFailed = true;
          registrationTxHash = 'FAILED';
        }
      } else {
        console.warn('Escrow not configured - skipping registration');
      }
    }

    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: newStatus as 'PUBLISHED' | 'REJECTED',
        verified: action === 'APPROVE',
      },
    });

    await db.audit.create({
      action: action,
      targetId: agentId,
      actorId: session.user.id,
      details: reason || `${action === 'APPROVE' ? 'Approved' : 'Rejected'} by admin` + 
        (registrationTxHash ? ` (escrow: ${registrationTxHash})` : ''),
    });

    return NextResponse.json({ 
      success: true, 
      status: newStatus,
      escrowRegistrationFailed,
      registrationTxHash,
    });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
  }

  try {
    const scan = await db.scans.findByAgentId(agentId);
    return NextResponse.json({ scan });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scan' }, { status: 500 });
  }
}