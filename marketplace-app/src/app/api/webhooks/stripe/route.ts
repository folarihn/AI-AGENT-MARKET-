import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function getStripe() {
  return new Stripe(requiredEnv('STRIPE_SECRET_KEY'), { apiVersion: '2026-01-28.clover' });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });

  const stripe = getStripe();
  const webhookSecret = requiredEnv('STRIPE_WEBHOOK_SECRET');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillCheckoutSession(session);
  }

  return NextResponse.json({ received: true });
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  const metadata = session.metadata ?? {};
  const userId = typeof metadata.userId === 'string' ? metadata.userId : '';
  const agentId = typeof metadata.agentId === 'string' ? metadata.agentId : '';

  if (!userId || !agentId) {
    throw new Error('checkout.session.completed missing metadata userId/agentId');
  }

  const amount = typeof session.amount_total === 'number' ? session.amount_total / 100 : 0;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.purchase.findUnique({ where: { stripeSessionId: sessionId } });
    if (existing?.status === 'COMPLETED') {
      return;
    }

    if (!existing) {
      await tx.purchase.create({
        data: {
          userId,
          agentId,
          stripeSessionId: sessionId,
          status: 'COMPLETED',
          amount: new Prisma.Decimal(amount),
        },
      });
    } else {
      await tx.purchase.update({
        where: { id: existing.id },
        data: { status: 'COMPLETED' },
      });
    }

    await tx.license.upsert({
      where: {
        userId_agentId: { userId, agentId },
      },
      update: {
        pricePaid: new Prisma.Decimal(amount),
      },
      create: {
        userId,
        agentId,
        pricePaid: new Prisma.Decimal(amount),
      },
    });

    await tx.auditLog.create({
      data: {
        agentId,
        action: 'PURCHASE',
        userId,
        details: `Stripe checkout.session.completed: ${sessionId}`,
        metadata: {
          stripeSessionId: sessionId,
        },
      },
    });
  });
}
