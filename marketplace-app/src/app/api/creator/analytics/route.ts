import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCreatorAnalytics } from '@/lib/creatorAnalytics';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'CREATOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('creatorId') || session.user.id;
  if (creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await getCreatorAnalytics(creatorId);
  return NextResponse.json(data);
}
