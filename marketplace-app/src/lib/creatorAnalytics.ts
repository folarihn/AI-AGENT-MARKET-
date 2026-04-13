import { prisma } from '@/lib/prisma';

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type CreatorAnalyticsResponse = {
  totals: {
    totalRevenue: number;
    totalDownloads: number;
    totalPublishedAgents: number;
  };
  perAgent: Array<{
    agentId: string;
    name: string;
    views: number;
    downloads: number;
    revenue: number;
    conversionRate: number;
  }>;
  series: Array<{ date: string; downloads: number }>;
};

export async function getCreatorAnalytics(creatorId: string): Promise<CreatorAnalyticsResponse> {
  const agents = await prisma.agent.findMany({
    where: { creatorId },
    select: { id: true, displayName: true, downloads: true, status: true },
  });

  const agentIds = agents.map((a) => a.id);
  if (agentIds.length === 0) {
    const today = new Date();
    const series = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      return { date: isoDate(d), downloads: 0 };
    });
    return {
      totals: { totalRevenue: 0, totalDownloads: 0, totalPublishedAgents: 0 },
      perAgent: [],
      series,
    };
  }

  const totalDownloads = agents.reduce((sum, a) => sum + (a.downloads || 0), 0);
  const totalPublishedAgents = agents.filter((a) => a.status === 'PUBLISHED').length;

  const [viewsByAgent, revenueByAgent] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ['agentId'],
      where: { agentId: { in: agentIds }, action: 'VIEW_AGENT' },
      _count: { _all: true },
    }),
    prisma.purchase.groupBy({
      by: ['agentId'],
      where: { agentId: { in: agentIds }, status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const viewsMap = new Map<string, number>(viewsByAgent.map((r) => [r.agentId, r._count._all]));
  const revenueMap = new Map<string, { revenue: number; completedPurchases: number }>(
    revenueByAgent.map((r) => [
      r.agentId,
      { revenue: Number(r._sum.amount?.toString() || 0), completedPurchases: r._count._all },
    ])
  );

  const perAgent = agents.map((a) => {
    const views = viewsMap.get(a.id) || 0;
    const purchases = revenueMap.get(a.id)?.completedPurchases || 0;
    const revenue = revenueMap.get(a.id)?.revenue || 0;
    const conversionRate = views > 0 ? (purchases / views) * 100 : 0;
    return {
      agentId: a.id,
      name: a.displayName,
      views,
      downloads: a.downloads || 0,
      revenue,
      conversionRate,
    };
  });

  const totalRevenue = perAgent.reduce((sum, a) => sum + a.revenue, 0);

  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const downloadEvents = await prisma.auditLog.findMany({
    where: {
      agentId: { in: agentIds },
      action: 'DOWNLOAD',
      createdAt: { gte: start },
    },
    select: { createdAt: true },
  });

  const bucket = new Map<string, number>();
  for (const e of downloadEvents) {
    const key = isoDate(e.createdAt);
    bucket.set(key, (bucket.get(key) || 0) + 1);
  }

  const series = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = isoDate(d);
    return { date: key, downloads: bucket.get(key) || 0 };
  });

  return {
    totals: { totalRevenue, totalDownloads, totalPublishedAgents },
    perAgent,
    series,
  };
}
