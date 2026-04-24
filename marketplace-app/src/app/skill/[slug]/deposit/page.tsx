import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createPublicClient, http } from 'viem';
import { ARC_CHAIN_ID, ARC_RPC_URL, USDC_ADDRESS } from '@/lib/wagmi';
import DepositClient from './DepositClient';

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

const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DepositPage({ params }: PageProps) {
  const { slug } = await params;
  
  const session = await auth();
  const userId = session?.user?.id;
  const walletAddress = (session?.user as { walletAddress?: string })?.walletAddress;
  
  if (!userId || !walletAddress) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500">Please connect your wallet first</p>
      </div>
    );
  }

  const skill = await prisma.agent.findFirst({
    where: { slug, itemType: 'SKILL', pricingModel: 'PER_CALL' },
    select: {
      id: true,
      name: true,
      displayName: true,
      pricePerCall: true,
    },
  });

  if (!skill) {
    notFound();
  }

  const pricePerCall = skill.pricePerCall ? Number(skill.pricePerCall) : 0;

  const [walletUSDC, escrowBalance] = await Promise.all([
    arcClient.readContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    }),
    arcClient.readContract({
      address: process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'getBalance',
      args: [walletAddress as `0x${string}`, skill.id as `0x${string}`],
    }),
  ]);

  const walletUSDCValue = Number(walletUSDC) / 1_000_000;
  const escrowUSDCValue = Number(escrowBalance) / 1_000_000;
  const estimatedCallsRemaining = pricePerCall > 0 ? escrowUSDCValue / pricePerCall : 0;

  return (
    <DepositClient
      skill={{
        id: skill.id,
        name: skill.name,
        displayName: skill.displayName,
        pricePerCall,
      }}
      walletUSDC={walletUSDCValue}
      escrowBalance={escrowUSDCValue}
      estimatedCallsRemaining={Math.floor(estimatedCallsRemaining)}
    />
  );
}