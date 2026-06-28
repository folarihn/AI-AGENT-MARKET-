import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/verification';

export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit('resend-verify', session.user.id, { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests. Please wait a bit.' }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, emailVerified: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ alreadyVerified: true });

  try {
    await sendVerificationEmail(user.email, user.name || '');
  } catch (err) {
    console.error('resend-verification failed:', err);
    return NextResponse.json({ error: 'Could not send the email right now.' }, { status: 500 });
  }
  return NextResponse.json({ sent: true });
}
