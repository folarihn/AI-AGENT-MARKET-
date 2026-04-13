import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: agentId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const [items, total, agg] = await Promise.all([
    prisma.review.findMany({
      where: { agentId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.review.count({ where: { agentId } }),
    prisma.review.aggregate({ where: { agentId }, _avg: { rating: true } }),
  ]);

  const mapName = (name?: string | null, email?: string | null) => {
    const n = (name || '')?.trim();
    if (n) {
      const parts = n.split(/\s+/);
      if (parts.length === 1) return parts[0];
      const first = parts[0];
      const last = parts[parts.length - 1];
      return `${first} ${last.charAt(0)}.`;
    }
    const e = (email || '').split('@')[0];
    return e ? `${e.slice(0, 1).toUpperCase()}${e.slice(1)}` : 'User';
  };

  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
      reviewerName: mapName(r.user?.name, r.user?.email),
      verifiedPurchase: true,
    })),
    page,
    pageSize,
    total,
    averageRating: agg._avg.rating ?? 0,
    reviewCount: total,
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: agentId } = await ctx.params;
  const body = await req.json();
  const rating = Number(body?.rating);
  const text = typeof body?.body === 'string' ? body.body.trim() : undefined;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer from 1 to 5' }, { status: 400 });
  }

  const license = await db.licenses.check(session.user.id, agentId);
  if (!license) {
    return NextResponse.json({ error: 'Verified purchase required' }, { status: 403 });
  }

  await prisma.review.upsert({
    where: { agentId_userId: { agentId, userId: session.user.id } },
    create: {
      agentId,
      userId: session.user.id,
      rating,
      body: text || null,
    },
    update: {
      rating,
      body: text ?? null,
    },
  });

  const [count, avg] = await Promise.all([
    prisma.review.count({ where: { agentId } }),
    prisma.review.aggregate({ where: { agentId }, _avg: { rating: true } }),
  ]);

  return NextResponse.json({
    success: true,
    averageRating: avg._avg.rating ?? 0,
    reviewCount: count,
  });
}
