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

  // Don't expose unpublished agents to anyone but the creator/admin.
  if (agent.status !== 'PUBLISHED') {
    const isOwner = session?.user?.id === agent.creatorId;
    const isAdmin = session?.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
  }

  // Only record views from authenticated users, so anonymous traffic can't be
  // used to flood the audit log (storage/cost).
  if (session?.user?.id) {
    await prisma.auditLog.create({
      data: {
        agentId,
        action: 'VIEW_AGENT',
        userId: session.user.id,
        details: 'Agent viewed',
      },
    });
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
