import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001';
  return raw.replace(/\/+$/, '');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL) return [];
  const agents = await prisma.agent.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
  });

  return agents.map((a) => ({
    url: `${siteUrl()}/agent/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));
}
