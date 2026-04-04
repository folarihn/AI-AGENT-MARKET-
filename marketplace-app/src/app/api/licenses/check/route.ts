import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const agentId = searchParams.get('agentId');

  if (!userId || !agentId) {
    return NextResponse.json({ hasLicense: false });
  }

  // Check if user is creator
  const agent = await db.agents.findById(agentId);
  if (agent && agent.creatorId === userId) {
      return NextResponse.json({ hasLicense: true, isCreator: true });
  }

  const license = await db.licenses.check(userId, agentId);
  return NextResponse.json({ hasLicense: !!license });
}
