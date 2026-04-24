import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const assets = await db.agents.findMany({
      status: 'PENDING_REVIEW',
    });

    const scans: Record<string, { status: 'PASS' | 'FAIL' }> = {};
    for (const asset of assets) {
      const scan = await db.scans.findByAgentId(asset.id);
      if (scan) {
        scans[asset.id] = { status: scan.status };
      }
    }

    return NextResponse.json({ assets, scans });
  } catch (error) {
    console.error('Failed to fetch queue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}