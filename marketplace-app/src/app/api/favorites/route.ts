import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET            -> { items: [...saved published agents] }
// GET ?agentId=X -> { favorited: boolean }   (for the heart button state)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const agentId = new URL(req.url).searchParams.get('agentId');
  if (agentId) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_agentId: { userId: session.user.id, agentId } },
      select: { id: true },
    });
    return NextResponse.json({ favorited: Boolean(fav) });
  }

  const favs = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { agentId: true },
  });
  const ids = favs.map((f) => f.agentId);
  if (ids.length === 0) return NextResponse.json({ items: [] });

  const agents = await prisma.agent.findMany({
    where: { id: { in: ids }, status: 'PUBLISHED' },
    select: {
      id: true, slug: true, displayName: true, description: true,
      category: true, itemType: true, price: true, creatorName: true,
      version: true, verified: true, downloads: true, rating: true, reviewsCount: true,
    },
  });
  // Preserve the saved order (newest-first).
  const byId = new Map(agents.map((a) => [a.id, a]));
  const items = ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((a) => ({ ...a!, price: Number(a!.price.toString()) }));

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const agentId = typeof body?.agentId === 'string' ? body.agentId : '';
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  // Idempotent: ignore if already saved.
  await prisma.favorite.upsert({
    where: { userId_agentId: { userId: session.user.id, agentId } },
    update: {},
    create: { userId: session.user.id, agentId },
  });
  return NextResponse.json({ favorited: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const agentId =
    new URL(req.url).searchParams.get('agentId') ||
    (await req.json().catch(() => ({})))?.agentId ||
    '';
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  await prisma.favorite.deleteMany({ where: { userId: session.user.id, agentId } });
  return NextResponse.json({ favorited: false });
}
