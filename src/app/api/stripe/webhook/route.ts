import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type Tier = 'free' | 'premium' | 'family';

function tierForPriceId(priceId: string | null | undefined): Tier {
  if (!priceId) return 'premium';
  if (priceId === STRIPE_PRICES.family_monthly) return 'family';
  return 'premium';
}

function tierFromSubscription(sub: Stripe.Subscription): Tier {
  const priceId = sub.items.data[0]?.price?.id;
  return tierForPriceId(priceId);
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${(err as Error).message}` }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // Idempotency: Stripe re-delivers events on transient failures. Skip
  // events we've already processed.
  const { error: insertErr } = await admin
    .from('processed_stripe_events')
    .insert({ id: event.id, event_type: event.type });
  if (insertErr) {
    // duplicate key → already processed → ack and exit
    if (insertErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Unknown DB error: don't ack so Stripe retries
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Resolve user_id from the most trustworthy signals first. metadata
        // is set by /api/checkout against the authenticated server session.
        // client_reference_id is a parallel signal. Customer metadata is a
        // last-resort fallback for legacy customers.
        let userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
        if (!userId && typeof session.customer === 'string') {
          const customer = await stripe.customers.retrieve(session.customer);
          if (customer && !('deleted' in customer && customer.deleted)) {
            userId = (customer.metadata?.supabase_user_id as string | undefined) ?? null;
          }
        }
        if (!userId || !session.subscription) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const tier = tierFromSubscription(sub);
        const customerId = typeof session.customer === 'string' ? session.customer : null;

        // Upsert (handles the case where the profile trigger hasn't run or
        // the row was deleted). user_id is unique on subscriptions.
        await admin.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            tier,
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
          },
          { onConflict: 'user_id' }
        );
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const tier = tierFromSubscription(sub);
        await admin
          .from('subscriptions')
          .update({
            tier,
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await admin
          .from('subscriptions')
          .update({
            tier: 'free',
            status: 'canceled',
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
        if (subId) {
          await admin
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subId);
        }
        break;
      }
    }
  } catch (err) {
    // Roll back the idempotency row so Stripe can retry.
    await admin.from('processed_stripe_events').delete().eq('id', event.id);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
