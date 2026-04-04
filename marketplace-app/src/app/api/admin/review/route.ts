import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { agentId, action, adminId, reason } = await req.json();

    if (!agentId || !action || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const agent = await db.agents.findById(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const newStatus = action === 'APPROVE' ? 'PUBLISHED' : 'REJECTED';

    // Update Agent Status
    await db.agents.update(agentId, {
      status: newStatus,
      verified: action === 'APPROVE', // Mark verified if approved by admin
    });

    // Create Audit Log
    await db.audit.create({
      action: action,
      targetId: agentId,
      actorId: adminId,
      details: reason || `${action === 'APPROVE' ? 'Approved' : 'Rejected'} by admin`,
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    // Helper to get scans for an agent
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
        return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }

    try {
        const scan = await db.scans.findByAgentId(agentId);
        return NextResponse.json({ scan });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch scan' }, { status: 500 });
    }
}
