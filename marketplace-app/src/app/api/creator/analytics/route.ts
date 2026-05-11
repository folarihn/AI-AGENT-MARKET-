import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCreatorAnalytics } from '@/lib/creatorAnalytics';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('creatorId') || session.user.id;
  if (creatorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (searchParams.get('purchases') === 'true') {
    const agentIds = (
      await prisma.agent.findMany({ where: { creatorId }, select: { id: true } })
    ).map((a) => a.id);

    const purchases = await prisma.purchase.findMany({
      where: { agentId: { in: agentIds }, status: 'COMPLETED' },
      include: { agent: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      purchases: purchases.map((p) => ({
        id: p.id,
        agentName: p.agent.displayName,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  }

  const data = await getCreatorAnalytics(creatorId);
  return NextResponse.json(data);
}
