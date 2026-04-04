import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

// Initialize Stripe with a mock key if env var is missing
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-06-20', // Use a recent API version
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentId, userId, price } = body;

    if (!agentId || !userId || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const agent = await db.agents.findById(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // In a real app, you'd create a Stripe Checkout Session here
    // const session = await stripe.checkout.sessions.create({ ... });

    // MOCK IMPLEMENTATION
    const mockSessionId = `cs_test_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a pending purchase record
    await db.purchases.create({
      userId,
      agentId,
      amount: price,
      status: 'pending',
      stripeSessionId: mockSessionId,
    });

    // Return the session ID and a mock URL to redirect to
    // In production, Stripe returns a session.url
    // For this MVP, we redirect to a local success page that simulates the return
    return NextResponse.json({
      sessionId: mockSessionId,
      url: `/checkout/success?session_id=${mockSessionId}`, 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
