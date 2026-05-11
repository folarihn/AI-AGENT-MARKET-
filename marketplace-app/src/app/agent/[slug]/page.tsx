import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AgentDetailClient, { type AgentDetail } from './AgentDetailClient';

export const revalidate = 3600;
export const dynamicParams = true;

function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001';
  return raw.replace(/\/+$/, '');
}

function canUseDb() {
  return Boolean(process.env.DATABASE_URL);
}

function firstParagraph(readme?: string | null) {
  const text = (readme || '').replace(/\r\n/g, '\n');
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const cleaned = block
      .replace(/^#+\s+/gm, '')
      .replace(/`{3}[\s\S]*?`{3}/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    if (cleaned.length >= 40) return cleaned.slice(0, 240);
    if (cleaned.length > 0) return cleaned;
  }
  return '';
}

async function getAgentBySlug(slug: string) {
  const agent = await prisma.agent.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      displayName: true,
      description: true,
      creatorId: true,
      creatorName: true,
      version: true,
      updatedAt: true,
      verified: true,
      price: true,
      status: true,
      readmeText: true,
      permissionsNetwork: true,
      permissionsFilesystem: true,
      permissionsSubprocess: true,
      category: true,
    },
  });
  return agent;
}

export async function generateStaticParams() {
  if (!canUseDb()) return [];
  const agents = await prisma.agent.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
  });
  return agents.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  if (!canUseDb()) return {};
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return {};

  const isPublished = agent.status === 'PUBLISHED';
  const canonical = `${siteUrl()}/agent/${agent.slug}`;
  const desc = firstParagraph(agent.readmeText) || agent.description;
  const title = `${agent.displayName} by ${agent.creatorName} · Agenti`;
  const ogImage = `${siteUrl()}/api/og/agent/${agent.slug}`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    robots: { index: isPublished, follow: isPublished },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [ogImage],
    },
  };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!canUseDb()) {
    return <div className="p-8 text-center text-gray-500">Database not configured.</div>;
  }
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) notFound();

  const [count, avg, scan, creator] = await Promise.all([
    prisma.review.count({ where: { agentId: agent.id } }),
    prisma.review.aggregate({ where: { agentId: agent.id }, _avg: { rating: true } }),
    prisma.scanResult.findFirst({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        status: true,
        malwareClean: true,
        secretsFound: true,
        disallowedFiles: true,
        findings: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: agent.creatorId },
      select: { emailVerified: true },
    }),
  ]);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: agent.displayName,
    description: firstParagraph(agent.readmeText) || agent.description,
    author: { '@type': 'Person', name: agent.creatorName },
    softwareVersion: agent.version,
    applicationCategory: agent.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: Number(agent.price.toString()),
      url: `${siteUrl()}/agent/${agent.slug}`,
      availability: agent.status === 'PUBLISHED' ? 'https://schema.org/InStock' : 'https://schema.org/Discontinued',
    },
  };

  if (count > 0) {
    (jsonLd as Record<string, unknown>).aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avg._avg.rating ?? 0,
      reviewCount: count,
    };
  }

  const clientAgent: AgentDetail = {
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    displayName: agent.displayName,
    description: agent.description,
    creatorId: agent.creatorId,
    creatorName: agent.creatorName,
    version: agent.version,
    updatedAt: agent.updatedAt.toISOString().slice(0, 10),
    verified: agent.verified,
    price: Number(agent.price.toString()),
    status: agent.status,
    readmeText: agent.readmeText,
    permissions: { network: agent.permissionsNetwork, filesystem: agent.permissionsFilesystem, subprocess: agent.permissionsSubprocess },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AgentDetailClient
        agent={clientAgent}
        initialReviewSummary={{ averageRating: avg._avg.rating ?? 0, reviewCount: count }}
        scan={
          scan
            ? {
                createdAt: scan.createdAt.toISOString(),
                status: scan.status,
                malwareClean: scan.malwareClean,
                secretsFound: scan.secretsFound,
                disallowedFiles: scan.disallowedFiles,
                findings: scan.findings,
              }
            : null
        }
        creatorEmailVerified={Boolean(creator?.emailVerified)}
      />
    </>
  );
}
