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

  const session = await auth();

  await prisma.auditLog.create({
    data: {
      agentId,
      action: 'VIEW_AGENT',
      userId: session?.user?.id ?? null,
      details: 'Agent viewed',
    },
  });

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
