import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { agentId, email, name } = body;

  if (!agentId || !email?.trim()) {
    return NextResponse.json({ error: 'agentId and email are required' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, status: true },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  await prisma.waitlistEntry.upsert({
    where: { agentId_email: { agentId, email: email.trim().toLowerCase() } },
    create: { agentId, email: email.trim().toLowerCase(), name: name?.trim() || null },
    update: {},
  });

  const count = await prisma.waitlistEntry.count({ where: { agentId } });

  return NextResponse.json({ success: true, count });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  const email = searchParams.get('email');

  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  }

  const [count, joined] = await Promise.all([
    prisma.waitlistEntry.count({ where: { agentId } }),
    email
      ? prisma.waitlistEntry.findUnique({
          where: { agentId_email: { agentId, email: email.toLowerCase() } },
        })
      : null,
  ]);

  return NextResponse.json({ count, joined: Boolean(joined) });
}
