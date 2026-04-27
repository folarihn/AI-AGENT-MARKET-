import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createPublicClient, http } from 'viem';
import { ARC_CHAIN_ID, ARC_RPC_URL, USDC_ADDRESS } from '@/lib/arc/config';
import { ShieldCheck, Download, Code, CreditCard, Zap, ArrowRight } from 'lucide-react';
import SkillDetailClient from './SkillDetailClient';

interface SkillInput {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
}

interface SkillOutput {
  name: string;
  type: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;

const arcClient = createPublicClient({
  chain: {
    id: ARC_CHAIN_ID,
    name: 'Arc Testnet',
    nativeCurrency: { decimals: 6, name: 'USDC', symbol: 'USDC' },
    rpcUrls: { default: { http: [ARC_RPC_URL] }, public: { http: [ARC_RPC_URL] } },
  },
  transport: http(ARC_RPC_URL),
});

const ESCROW_ABI = [
  { name: 'getBalance', type: 'function', inputs: [{ name: 'user', type: 'address' }, { name: 'skillId', type: 'bytes32' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const;

export default async function SkillPage({ params }: PageProps) {
  const { slug } = await params;
  
  const skill = await prisma.agent.findFirst({
    where: { slug, itemType: 'SKILL' },
    include: {
      scans: { orderBy: { createdAt: 'desc' }, take: 1 },
      creator: true,
    },
  });

  if (!skill || skill.itemType !== 'SKILL') {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;
  const walletAddress = session?.user?.walletAddress;
  
  const hasLicense = userId 
    ? await prisma.license.findUnique({
        where: { userId_agentId: { userId, agentId: skill.id } },
      }).then(Boolean)
    : false;

  const usage = userId
    ? await prisma.skillUsage.findFirst({
        where: { 
          userId, 
          skillId: skill.id,
          period: new Date().toISOString().slice(0, 7),
        },
      })
    : null;

  let escrowBalance = 0;
  if (walletAddress && skill.pricingModel === 'PER_CALL' && ESCROW_ADDRESS) {
    try {
      const balance = await arcClient.readContract({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'getBalance',
        args: [walletAddress as `0x${string}`, skill.id as `0x${string}`],
      });
      escrowBalance = Number(balance) / 1_000_000;
    } catch {
      escrowBalance = 0;
    }
  }

  const inputs = (skill.inputs as SkillInput[] | null) || [];
  const outputs = (skill.outputs as SkillOutput[] | null) || [];
  
  const scan = skill.scans[0];

  return (
    <SkillDetailClient
      skill={{
        id: skill.id,
        slug: skill.slug,
        name: skill.name,
        displayName: skill.displayName,
        description: skill.description,
        version: skill.version,
        creatorId: skill.creatorId,
        creatorName: skill.creatorName,
        runtime: skill.runtime || 'python3.11',
        verified: skill.verified,
        price: Number(skill.price),
        pricePerCall: skill.pricePerCall ? Number(skill.pricePerCall) : null,
        pricingModel: skill.pricingModel,
        inputs,
        outputs,
        tags: skill.tags || [],
        readmeText: skill.readmeText || undefined,
        permissions: {
          network: skill.permissionsNetwork,
          filesystem: skill.permissionsFilesystem,
          subprocess: skill.permissionsSubprocess,
        },
      }}
      scan={scan ? {
        passed: scan.passed,
        malwareClean: scan.malwareClean,
        secretsFound: scan.secretsFound,
      } : null}
      hasLicense={hasLicense}
      escrowBalance={escrowBalance}
      usage={usage ? { callCount: usage.callCount, usdcSpent: Number(usage.usdcSpent) } : null}
      creatorEmailVerified={!!skill.creator.emailVerified}
    />
  );
}