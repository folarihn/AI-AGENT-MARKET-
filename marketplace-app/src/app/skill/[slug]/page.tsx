export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
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
      usage={usage ? { callCount: usage.callCount, usdcSpent: Number(usage.usdcSpent) } : null}
      creatorEmailVerified={!!skill.creator.emailVerified}
    />
  );
}