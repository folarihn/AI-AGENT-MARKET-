import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const runtime = 'nodejs';

const reasons = ['MALICIOUS_BEHAVIOR', 'MISLEADING_DESCRIPTION', 'BROKEN', 'SPAM'] as const;
type Reason = (typeof reasons)[number];

function getAdminEmails() {
  const raw = process.env.ADMIN_ALERT_EMAILS || process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendAdminEmail(payload: {
  to: string[];
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: agentId } = await ctx.params;
  const session = await auth();
  const reporterId = session?.user?.id ?? null;

  const body = await req.json().catch(() => ({}));
  const reason = (body?.reason as string | undefined)?.toUpperCase() as Reason | undefined;
  const message = typeof body?.message === 'string' ? body.message.trim() : null;

  if (!reason || !reasons.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
  }
  if (message && message.length > 2000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, slug: true, displayName: true, creatorId: true, creatorName: true, status: true },
  });
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const userAgent = req.headers.get('user-agent') || null;

  const alert = await prisma.adminAlert.create({
    data: {
      agentId,
      reporterId,
      reason,
      message,
      metadata: {
        ip,
        userAgent,
        agentStatus: agent.status,
      },
    },
  });

  const to = getAdminEmails();
  if (to.length > 0) {
    const reporterName = session?.user?.name || session?.user?.email || 'Anonymous';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001';
    const agentUrl = `${baseUrl.replace(/\/+$/, '')}/agent/${agent.slug}`;

    const subject = `Agent report: ${agent.displayName} (${reason.replace(/_/g, ' ')})`;
    const html = `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.4">
        <h2>Agent report received</h2>
        <p><strong>Agent:</strong> ${agent.displayName} (${agentUrl})</p>
        <p><strong>Creator:</strong> ${agent.creatorName}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Reporter:</strong> ${reporterName}</p>
        ${message ? `<p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>` : ''}
        <p><strong>Alert ID:</strong> ${alert.id}</p>
      </div>
    `;

    await sendAdminEmail({ to, subject, html }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
