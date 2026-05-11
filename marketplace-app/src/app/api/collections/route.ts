import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('creatorId');
  const mine = searchParams.get('mine') === 'true';

  const session = await auth();

  if (mine) {
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const collections = await prisma.collection.findMany({
      where: { creatorId: session.user.id },
      include: {
        items: {
          include: { agent: { select: { id: true, displayName: true, slug: true, price: true, itemType: true } } },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ collections });
  }

  const where = {
    isPublished: true,
    ...(creatorId ? { creatorId } : {}),
  };

  const collections = await prisma.collection.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true } },
      items: {
        include: {
          agent: { select: { id: true, displayName: true, slug: true, price: true, itemType: true, rating: true } },
        },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ collections });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Creator account required' }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, agentIds, isPublished } = body;

  if (!name?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'name and description are required' }, { status: 400 });
  }

  let slug = toSlug(name);
  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const collection = await prisma.collection.create({
    data: {
      creatorId: session.user.id,
      name: name.trim(),
      slug,
      description: description.trim(),
      isPublished: Boolean(isPublished),
      items: {
        create: (agentIds || []).map((agentId: string, i: number) => ({
          agentId,
          position: i,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ success: true, collection }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, name, description, agentIds, isPublished } = body;

  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (collection.creatorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.collection.update({
    where: { id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(description ? { description: description.trim() } : {}),
      ...(isPublished !== undefined ? { isPublished } : {}),
      ...(agentIds
        ? {
            items: {
              deleteMany: {},
              create: agentIds.map((agentId: string, i: number) => ({ agentId, position: i })),
            },
          }
        : {}),
    },
    include: { items: { include: { agent: { select: { displayName: true, slug: true } } } } },
  });

  return NextResponse.json({ success: true, collection: updated });
}
