import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    // In a real environment, verify the signature
    // event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
    
    // For MVP/Demo without real Stripe, we parse the body directly
    // This allows us to simulate webhooks from our frontend
    const jsonBody = JSON.parse(body);
    event = jsonBody as Stripe.Event;
    
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  
  // 1. Find the pending purchase
  const purchase = await db.purchases.findBySessionId(sessionId);
  if (!purchase) {
    console.error('Purchase not found for session:', sessionId);
    return;
  }

  // 2. Update purchase status
  await db.purchases.updateStatus(purchase.id, 'completed');

  // 3. Create License
  await db.licenses.create({
    userId: purchase.userId,
    agentId: purchase.agentId,
    pricePaid: purchase.amount,
  });

  // 4. Audit Log
  await db.audit.create({
    action: 'APPROVE', // Reusing APPROVE or create a new BUY action type
    targetId: purchase.agentId,
    actorId: purchase.userId,
    details: `Purchase completed for agent ${purchase.agentId}`,
  });

  console.log(`Purchase fulfilled for user ${purchase.userId} and agent ${purchase.agentId}`);
}
