import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { storage } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { checkNFTOwnership } from '@/lib/arc/license';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: agentId } = await context.params;
  const agent = await db.agents.findById(agentId);

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const isFree = agent.price === 0;
  
  if (!isFree) {
    let hasNFTLicense = false;
    const walletAddress = (session.user as { walletAddress?: string }).walletAddress;
    
    if (walletAddress) {
      hasNFTLicense = await checkNFTOwnership(walletAddress, agentId);
    }
    
    const dbLicense = await db.licenses.check(session.user.id, agentId);
    const isCreator = agent.creatorId === session.user.id;

    if (!hasNFTLicense && !dbLicense && !isCreator) {
      return NextResponse.json({ error: 'Payment required' }, { status: 403 });
    }
  }

  await db.agents.update(agentId, { downloads: agent.downloads + 1 });

  await prisma.auditLog.create({
    data: {
      agentId,
      action: 'DOWNLOAD',
      userId: session.user.id,
      details: 'Agent downloaded',
    },
  });

  const storagePath = `agents/${agentId}/${agent.version}/package.zip`;
  const url = await storage.getPresignedDownloadUrl(storagePath, 600);
  return NextResponse.redirect(url);
}