import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const agentId = params.id;
  const agent = await db.agents.findById(agentId);

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Check for license if not free (assuming all agents have a price for now, or check price)
  const isFree = agent.price === 0;
  
  if (!isFree) {
    const license = await db.licenses.check(userId, agentId);
    
    // Also check if user is the creator (creators can download their own agents)
    const isCreator = agent.creatorId === userId;

    if (!license && !isCreator) {
      return NextResponse.json({ error: 'Payment required' }, { status: 403 });
    }
  }

  // Increment download count
  await db.agents.update(agentId, { downloads: agent.downloads + 1 });

  // In a real app, you would generate a presigned URL for S3
  // return NextResponse.redirect(presignedUrl);

  // For MVP, we return a mock file download
  const mockContent = `Package content for ${agent.name} (v${agent.version})\n\nThis is a secure download.`;
  
  return new NextResponse(mockContent, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${agent.name.replace(/\s+/g, '_')}_v${agent.version}.zip"`,
    },
  });
}
