import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { auth } from '@/auth';

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
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const agentId = typeof body?.agentId === 'string' ? body.agentId : '';

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const agent = await db.agents.findById(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const priceNumber = agent.price;

    if (priceNumber <= 0) {
      return NextResponse.json({ error: 'This agent is free. No checkout required.' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || new URL(request.url).origin;
    const stripe = getStripe();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(priceNumber * 100),
            product_data: {
              name: agent.displayName,
            },
          },
        },
      ],
      metadata: {
        userId: session.user.id,
        agentId,
      },
      customer_email: session.user.email ?? undefined,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/agent/${agent.slug}`,
    });

    await db.purchases.create({
      userId: session.user.id,
      agentId,
      amount: priceNumber,
      status: 'pending',
      stripeSessionId: checkoutSession.id,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
