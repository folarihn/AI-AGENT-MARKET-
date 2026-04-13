import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ hasLicense: false });
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return NextResponse.json({ hasLicense: false });
  }

  // Check if user is creator
  const agent = await db.agents.findById(agentId);
  if (agent && agent.creatorId === session.user.id) {
      return NextResponse.json({ hasLicense: true, isCreator: true });
  }

  const license = await db.licenses.check(session.user.id, agentId);
  return NextResponse.json({ hasLicense: !!license });
}
