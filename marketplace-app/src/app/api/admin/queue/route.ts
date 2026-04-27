import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');

    const where: Record<string, unknown> = { status: 'PENDING_REVIEW' };
    if (creatorId) {
      where.creatorId = creatorId;
    }

    const assets = await db.agents.findMany({
      where,
    });

    const scans: Record<string, { status: 'PASS' | 'FAIL' }> = {};
    const registrationStatuses: Record<string, string> = {};
    for (const asset of assets) {
      const scan = await db.scans.findByAgentId(asset.id);
      if (scan) {
        scans[asset.id] = { status: scan.status };
      }
      registrationStatuses[asset.id] = asset.registrationTxHash || 'none';
    }

    return NextResponse.json({ assets, scans, registrationStatuses });
  } catch (error) {
    console.error('Failed to fetch queue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}