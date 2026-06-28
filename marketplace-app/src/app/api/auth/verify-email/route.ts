import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET ?token=... → mark the user's email verified, then redirect to /login.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || '';
  const redirect = (status: string) =>
    NextResponse.redirect(new URL(`/login?verified=${status}`, req.url));

  if (!token) return redirect('invalid');

  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  if (!vt) return redirect('invalid');

  if (vt.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token } });
    return redirect('expired');
  }

  await prisma.user.updateMany({
    where: { email: vt.identifier },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.deleteMany({ where: { token } });

  return redirect('success');
}
