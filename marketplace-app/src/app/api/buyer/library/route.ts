import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || session.user.id;
  if (userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const licenses = await db.licenses.findByUser(userId);
  const items = [];
  for (const lic of licenses) {
    const agent = await db.agents.findById(lic.agentId);
    if (!agent) continue;
    const updatedSincePurchase =
      new Date(agent.updatedAt).getTime() > new Date(lic.purchasedAt).getTime();
    items.push({
      agent: {
        id: agent.id,
        displayName: agent.displayName,
        version: agent.version,
        creatorName: agent.creatorName,
        updatedAt: agent.updatedAt,
      },
      license: {
        createdAt: lic.purchasedAt,
      },
      updatedSincePurchase,
    });
  }
  return NextResponse.json({ items });
}
