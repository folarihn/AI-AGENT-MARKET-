import { NextRequest, NextResponse } from 'next/server';
import { AgentCategory } from '@prisma/client';
import { searchAgents } from '@/lib/agentSearch';
import { prisma } from '@/lib/prisma';

function parseNumber(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeCategory(v: string | null): AgentCategory | null {
  if (!v) return null;
  const upper = v.trim().toUpperCase();
  const allowed = new Set<AgentCategory>([
    'AUTOMATION',
    'DATA',
    'COMMUNICATION',
    'PRODUCTIVITY',
    'DEVTOOLS',
    'RESEARCH',
    'OTHER',
  ]);
  return allowed.has(upper as AgentCategory) ? (upper as AgentCategory) : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Creator-specific listing: return ALL their agents regardless of status
  const creatorId = searchParams.get('creatorId');
  if (creatorId) {
    const items = await prisma.agent.findMany({
      where: { creatorId },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(60, parseInt(searchParams.get('pageSize') || '24', 10)),
      select: {
        id: true, slug: true, displayName: true, description: true,
        category: true, itemType: true, price: true, creatorName: true,
        version: true, updatedAt: true, verified: true, downloads: true,
        rating: true, reviewsCount: true, status: true,
      },
    });
    return NextResponse.json({
      page: 1,
      pageSize: items.length,
      total: items.length,
      countsByCategory: {},
      items: items.map(a => ({ ...a, price: Number(a.price.toString()) })),
    });
  }

  const q = (searchParams.get('q') || '').trim();
  const category = normalizeCategory(searchParams.get('category'));
  const priceMin = parseNumber(searchParams.get('priceMin'));
  const priceMax = parseNumber(searchParams.get('priceMax'));
  const sort = (searchParams.get('sort') || 'popular') as 'popular' | 'newest' | 'price';
  const itemType = (searchParams.get('itemType') || 'ALL') as 'AGENT' | 'SKILL' | 'ALL';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(60, Math.max(1, parseInt(searchParams.get('pageSize') || '24', 10)));

  const data = await searchAgents({
    q,
    category,
    priceMin,
    priceMax,
    sort,
    itemType,
    page,
    pageSize,
  });

  return NextResponse.json(data);
}
