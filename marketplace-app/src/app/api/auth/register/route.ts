import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit, getIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registrations per IP per hour (brute-force / account-farming protection)
    const ip = getIp(request);
    const rl = await rateLimit('register', ip, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
      });
    }

    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const role = typeof body?.role === 'string' ? body.role : 'BUYER';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (role !== 'BUYER' && role !== 'CREATOR') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
