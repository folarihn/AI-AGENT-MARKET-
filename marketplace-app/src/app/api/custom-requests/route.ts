import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CustomRequestCategory } from '@prisma/client';

const VALID_CATEGORIES = Object.values(CustomRequestCategory);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, title, description, category, budget } = body;

    if (!name?.trim() || !email?.trim() || !title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'name, email, title, and description are required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (title.length > 120) {
      return NextResponse.json({ error: 'Title must be 120 characters or fewer' }, { status: 400 });
    }

    if (description.length > 2000) {
      return NextResponse.json({ error: 'Description must be 2000 characters or fewer' }, { status: 400 });
    }

    const resolvedCategory: CustomRequestCategory =
      VALID_CATEGORIES.includes(category) ? category : 'OTHER';

    const request = await prisma.customRequest.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        title: title.trim(),
        description: description.trim(),
        category: resolvedCategory,
        budget: budget?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, id: request.id }, { status: 201 });
  } catch (err) {
    console.error('custom-requests POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 20;

  const where = status ? { status: status as never } : {};

  const [items, total] = await Promise.all([
    prisma.customRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customRequest.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, status } = body;

  const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'FULFILLED', 'CLOSED'];
  if (!id || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'id and valid status required' }, { status: 400 });
  }

  const updated = await prisma.customRequest.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ success: true, item: updated });
}
