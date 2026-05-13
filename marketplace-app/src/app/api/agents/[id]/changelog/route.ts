import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entries = await prisma.agentChangelog.findMany({
    where: { agentId: id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ entries });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const agent = await prisma.agent.findUnique({ where: { id }, select: { creatorId: true } });
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (agent.creatorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { version, title, body: entryBody } = body;

  if (!version?.trim() || !title?.trim() || !entryBody?.trim()) {
    return NextResponse.json({ error: 'version, title, and body are required' }, { status: 400 });
  }

  const entry = await prisma.agentChangelog.create({
    data: { agentId: id, version: version.trim(), title: title.trim(), body: entryBody.trim() },
  });

  return NextResponse.json({ success: true, entry }, { status: 201 });
}
