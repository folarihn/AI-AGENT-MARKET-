import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail, verificationEmail } from '@/lib/email';

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://ai-agent-market-rose.vercel.app'
  ).replace(/\/+$/, '');
}

/**
 * Generate a single-use verification token, store it, and email the user a link.
 * Best-effort — callers should not block signup on this.
 */
export async function sendVerificationEmail(email: string, name: string): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Replace any outstanding token for this email.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  const verifyUrl = `${siteUrl()}/api/auth/verify-email?token=${token}`;
  await sendEmail({ to: email, ...verificationEmail({ name, verifyUrl }) });
}
