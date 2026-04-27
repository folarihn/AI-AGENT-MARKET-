import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: agentId } = await ctx.params;
  const agent = await db.agents.findById(agentId);
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  if (agent.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const session = await auth();
  const needsAuth = agent.price > 0;
  if (needsAuth && !session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const [count, avg] = await Promise.all([
    prisma.review.count({ where: { agentId } }),
    prisma.review.aggregate({ where: { agentId }, _avg: { rating: true } }),
  ]);

  return NextResponse.json({
    agent,
    averageRating: avg._avg.rating ?? 0,
    reviewCount: count,
  });
}
