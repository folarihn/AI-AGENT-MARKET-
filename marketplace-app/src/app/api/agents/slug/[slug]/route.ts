import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await auth();
  const userId = session?.user?.id;

  const agent = await prisma.agent.findUnique({
    where: { slug },
    include: {
      creator: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const isOwner = userId && agent.creatorId === userId;
  const isAdmin = session?.user?.role === 'ADMIN';
  const canViewPrivate = isOwner || isAdmin;

  if (agent.status !== 'PUBLISHED' && !canViewPrivate) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const [scanResult, reviews, reviewStats, purchaseCount] = await Promise.all([
    prisma.scanResult.findFirst({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.findMany({
      where: { agentId: agent.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    }),
    prisma.review.aggregate({
      where: { agentId: agent.id },
      _avg: { rating: true },
    }),
    prisma.purchase.count({
      where: { agentId: agent.id, status: 'COMPLETED' },
    }),
  ]);

  if (userId) {
    await prisma.auditLog.create({
      data: {
        agentId: agent.id,
        action: 'VIEW_AGENT',
        userId,
        details: `Viewed agent via API: ${slug}`,
      },
    });
  }

  const mappedReviews = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.createdAt,
    reviewerName: r.user?.name || 'Anonymous',
  }));

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      displayName: agent.displayName,
      description: agent.description,
      version: agent.version,
      category: agent.category,
      tags: agent.tags,
      status: agent.status,
      price: Number(agent.price.toString()),
      downloads: agent.downloads,
      rating: agent.rating,
      reviewsCount: agent.reviewsCount,
      verified: agent.verified,
      readmeText: agent.readmeText,
      permissions: {
        network: agent.permissionsNetwork,
        filesystem: agent.permissionsFilesystem,
        subprocess: agent.permissionsSubprocess,
      },
      pricingModel: agent.pricingModel,
      pricePerCall: agent.pricePerCall ? Number(agent.pricePerCall.toString()) : null,
      runtime: agent.runtime,
      inputs: agent.inputs,
      outputs: agent.outputs,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    },
    creator: agent.creator,
    scanResult: scanResult
      ? {
          status: scanResult.status,
          malwareClean: scanResult.malwareClean,
          secretsFound: scanResult.secretsFound,
          createdAt: scanResult.createdAt,
        }
      : null,
    reviews: mappedReviews,
    _count: {
      reviews: reviewStats._count?._all || 0,
      purchases: purchaseCount,
    },
    averageRating: reviewStats._avg.rating || 0,
  });
}