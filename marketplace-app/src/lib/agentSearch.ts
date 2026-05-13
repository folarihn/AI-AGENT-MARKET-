import { prisma } from '@/lib/prisma';
import { AgentCategory, Prisma } from '@prisma/client';

export type AgentSort = 'popular' | 'newest' | 'price';

export type AgentListItem = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  category: AgentCategory;
  itemType: 'AGENT' | 'SKILL';
  price: number;
  creatorName: string;
  version: string;
  updatedAt: Date;
  verified: boolean;
  downloads: number;
  rating: number;
  reviewsCount: number;
};

export type AgentSearchResponse = {
  page: number;
  pageSize: number;
  total: number;
  countsByCategory: Record<string, number>;
  items: AgentListItem[];
};

export type AgentSearchParams = {
  q?: string;
  category?: AgentCategory | null;
  priceMin?: number | null;
  priceMax?: number | null;
  sort?: AgentSort;
  itemType?: 'AGENT' | 'SKILL' | 'ALL';
  page?: number;
  pageSize?: number;
};

function buildTsQuery(q: string) {
  const tokens = q.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return tokens.map((t) => `${t}:*`).join(' & ');
}

export async function searchAgents(params: AgentSearchParams): Promise<AgentSearchResponse> {
  const q = (params.q || '').trim();
  const category = params.category ?? null;
  const priceMin = params.priceMin ?? null;
  const priceMax = params.priceMax ?? null;
  const sort: AgentSort = params.sort || 'popular';
  const itemType = params.itemType || 'ALL';
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(60, Math.max(1, params.pageSize || 24));
  const offset = (page - 1) * pageSize;

  const baseWhere: Prisma.AgentWhereInput = {
    status: 'PUBLISHED',
    ...(category ? { category } : {}),
    ...(itemType !== 'ALL' ? { itemType } : {}),
    ...(priceMin !== null || priceMax !== null
      ? {
          price: {
            ...(priceMin !== null ? { gte: priceMin } : {}),
            ...(priceMax !== null ? { lte: priceMax } : {}),
          },
        }
      : {}),
  };

  const countsWhere: Prisma.AgentWhereInput = {
    status: 'PUBLISHED',
    ...(itemType !== 'ALL' ? { itemType } : {}),
    ...(priceMin !== null || priceMax !== null
      ? {
          price: {
            ...(priceMin !== null ? { gte: priceMin } : {}),
            ...(priceMax !== null ? { lte: priceMax } : {}),
          },
        }
      : {}),
  };

  const orderBy =
    sort === 'newest'
      ? [{ createdAt: 'desc' as const }]
      : sort === 'price'
        ? [{ price: 'asc' as const }]
        : [{ downloads: 'desc' as const }];

  if (!q) {
    const [items, total, categoryCounts] = await Promise.all([
      prisma.agent.findMany({
        where: baseWhere,
        orderBy,
        skip: offset,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          displayName: true,
          description: true,
          category: true,
          itemType: true,
          price: true,
          creatorName: true,
          version: true,
          updatedAt: true,
          verified: true,
          downloads: true,
          rating: true,
          reviewsCount: true,
        },
      }),
      prisma.agent.count({ where: baseWhere }),
      prisma.agent.groupBy({
        by: ['category'],
        where: countsWhere,
        _count: { _all: true },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      countsByCategory: Object.fromEntries(categoryCounts.map((c) => [c.category, c._count._all])),
      items: items.map((a) => ({
        ...a,
        price: Number(a.price.toString()),
      })),
    };
  }

  const tsQuery = buildTsQuery(q);
  const useFts = q.length >= 3 && tsQuery.length > 0;

  if (!useFts) {
    const where: Prisma.AgentWhereInput = {
      ...baseWhere,
      OR: [
        { displayName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    };

    const [items, total, categoryCounts] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy,
        skip: offset,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          displayName: true,
          description: true,
          category: true,
          itemType: true,
          price: true,
          creatorName: true,
          version: true,
          updatedAt: true,
          verified: true,
          downloads: true,
          rating: true,
          reviewsCount: true,
        },
      }),
      prisma.agent.count({ where }),
      prisma.agent.groupBy({
        by: ['category'],
        where: {
          ...countsWhere,
          OR: [
            { displayName: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        _count: { _all: true },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      countsByCategory: Object.fromEntries(categoryCounts.map((c) => [c.category, c._count._all])),
      items: items.map((a) => ({
        ...a,
        price: Number(a.price.toString()),
      })),
    };
  }

  let nextParam = 4;
  const filters: string[] = [];
  const filterParams: Array<string | number> = [];

  if (category) {
    filters.push(`AND a."category" = $${nextParam}::"AgentCategory"`);
    filterParams.push(category);
    nextParam += 1;
  }
  if (itemType !== 'ALL') {
    filters.push(`AND a."itemType" = $${nextParam}::"ItemType"`);
    filterParams.push(itemType);
    nextParam += 1;
  }
  if (priceMin !== null) {
    filters.push(`AND a."price" >= $${nextParam}`);
    filterParams.push(priceMin);
    nextParam += 1;
  }
  if (priceMax !== null) {
    filters.push(`AND a."price" <= $${nextParam}`);
    filterParams.push(priceMax);
    nextParam += 1;
  }

  const secondaryOrder =
    sort === 'newest'
      ? `a."createdAt" DESC`
      : sort === 'price'
        ? `a."price" ASC`
        : `a."downloads" DESC`;

  const itemsSql = `
    WITH query AS (SELECT to_tsquery('english', $1) AS q)
    SELECT
      a."id",
      a."slug",
      a."displayName",
      a."description",
      a."category",
      a."itemType",
      a."price",
      a."creatorName",
      a."version",
      a."updatedAt",
      a."verified",
      a."downloads",
      a."rating",
      a."reviewsCount",
      ts_rank(a."searchVector", query.q) AS rank
    FROM "Agent" a, query
    WHERE a."status" = 'PUBLISHED'
      AND a."searchVector" @@ query.q
      ${filters.join('\n      ')}
    ORDER BY rank DESC, ${secondaryOrder}
    LIMIT $2 OFFSET $3
  `;

  const countSql = `
    WITH query AS (SELECT to_tsquery('english', $1) AS q)
    SELECT COUNT(*)::int AS total
    FROM "Agent" a, query
    WHERE a."status" = 'PUBLISHED'
      AND a."searchVector" @@ query.q
      ${filters.join('\n      ')}
  `;

  let countsNext = 2;
  const countsFilters: string[] = [];
  const countsParams: Array<number> = [];
  if (itemType !== 'ALL') {
    countsFilters.push(`AND a."itemType" = $${countsNext}::"ItemType"`);
    countsParams.push(itemType as unknown as number);
    countsNext += 1;
  }
  if (priceMin !== null) {
    countsFilters.push(`AND a."price" >= $${countsNext}`);
    countsParams.push(priceMin);
    countsNext += 1;
  }
  if (priceMax !== null) {
    countsFilters.push(`AND a."price" <= $${countsNext}`);
    countsParams.push(priceMax);
    countsNext += 1;
  }

  const countsSql = `
    WITH query AS (SELECT to_tsquery('english', $1) AS q)
    SELECT a."category"::text AS category, COUNT(*)::int AS count
    FROM "Agent" a, query
    WHERE a."status" = 'PUBLISHED'
      AND a."searchVector" @@ query.q
      ${countsFilters.join('\n      ')}
    GROUP BY a."category"
  `;

  const sqlParams = [tsQuery, pageSize, offset, ...filterParams];
  const sqlCountParams = [tsQuery, ...filterParams];
  const sqlCountsParams = [tsQuery, ...countsParams];

  type RawRow = {
    id: string;
    slug: string;
    displayName: string;
    description: string;
    category: AgentCategory;
    itemType: 'AGENT' | 'SKILL';
    price: unknown;
    creatorName: string;
    version: string;
    updatedAt: Date;
    verified: boolean;
    downloads: number;
    rating: number;
    reviewsCount: number;
    rank: number;
  };

  const [rawItems, totalRows, countsRows] = await Promise.all([
    prisma.$queryRawUnsafe<RawRow[]>(itemsSql, ...sqlParams),
    prisma.$queryRawUnsafe<{ total: number }[]>(countSql, ...sqlCountParams),
    prisma.$queryRawUnsafe<{ category: string; count: number }[]>(countsSql, ...sqlCountsParams),
  ]);

  const total = totalRows?.[0]?.total ?? 0;
  const countsByCategory = Object.fromEntries(countsRows.map((r) => [r.category, r.count]));

  return {
    page,
    pageSize,
    total,
    countsByCategory,
    items: rawItems.map((a) => ({
      ...a,
      price: Number(a.price),
    })),
  };
}
