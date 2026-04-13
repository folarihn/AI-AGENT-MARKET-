import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const agent = await prisma.agent.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      displayName: true,
      description: true,
      category: true,
      tags: true,
      status: true,
      price: true,
      creatorId: true,
      creatorName: true,
      version: true,
      updatedAt: true,
      verified: true,
      downloads: true,
      rating: true,
      reviewsCount: true,
      permissionsNetwork: true,
      permissionsFilesystem: true,
      readmeText: true,
    },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const [count, avg] = await Promise.all([
    prisma.review.count({ where: { agentId: agent.id } }),
    prisma.review.aggregate({ where: { agentId: agent.id }, _avg: { rating: true } }),
  ]);

  return NextResponse.json({
    agent: {
      ...agent,
      price: Number(agent.price.toString()),
      permissions: { network: agent.permissionsNetwork, filesystem: agent.permissionsFilesystem },
    },
    averageRating: avg._avg.rating ?? 0,
    reviewCount: count,
  });
}
