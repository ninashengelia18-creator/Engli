import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICES, type PriceKey } from '@/lib/stripe';

export async function POST(req: Request) {
  let body: { priceKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const priceKey = body.priceKey as PriceKey | undefined;
  if (!priceKey || !(priceKey in STRIPE_PRICES)) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  }
  const priceId = STRIPE_PRICES[priceKey];
  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find or create Stripe customer keyed off the authenticated user. We
  // never trust the client to tell us who they are.
  const admin = createServiceRoleClient();
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id, status, tier')
    .eq('user_id', user.id)
    .single();

  // Defense-in-depth: if the user already has a live paid sub, block a
  // duplicate checkout. The webhook would heal it anyway, but this prevents
  // accidental double-charges from a stale tab.
  if (sub && sub.tier !== 'free' && (sub.status === 'active' || sub.status === 'trialing')) {
    return NextResponse.json(
      { error: 'Already subscribed', alreadySubscribed: true },
      { status: 409 }
    );
  }

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id }
    });
    customerId = customer.id;
    await admin
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    // client_reference_id is echoed back on checkout.session.completed even
    // if metadata is dropped, giving the webhook a second identity signal
    // bound to the authenticated server session.
    client_reference_id: user.id,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { supabase_user_id: user.id }
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/learn?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
    metadata: { user_id: user.id, price_key: priceKey }
  });

  return NextResponse.json({ url: session.url });
}
