import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, STRIPE_WEBHOOK_SECRET, isSubscriptionActive } from '@/lib/stripe';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events to keep user subscription state in sync.
 *
 * Events handled:
 * - checkout.session.completed → activate Pro subscription
 * - customer.subscription.updated → update subscription status
 * - customer.subscription.deleted → downgrade to free
 * - invoice.payment_failed → notify user (future)
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const adminSupabase = await createAdminSupabaseClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.metadata?.supabase_user_id;
          if (!userId) break;

          const subscription = await getStripe().subscriptions.retrieve(
            session.subscription as string
          );

          await adminSupabase
            .from('user_profiles')
            .update({
              tier: isSubscriptionActive(subscription.status) ? 'pro' : 'free',
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId);

          console.log(
            `[stripe-webhook] checkout.session.completed → user ${userId} upgraded to Pro`
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          // Try to look up by stripe_subscription_id
          const { data: profile } = await adminSupabase
            .from('user_profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (profile) {
            await adminSupabase
              .from('user_profiles')
              .update({
                tier: isSubscriptionActive(subscription.status) ? 'pro' : 'free',
                subscription_status: subscription.status,
              })
              .eq('id', profile.id);
          }
          break;
        }

        await adminSupabase
          .from('user_profiles')
          .update({
            tier: isSubscriptionActive(subscription.status) ? 'pro' : 'free',
            subscription_status: subscription.status,
          })
          .eq('id', userId);

        console.log(
          `[stripe-webhook] subscription.updated → user ${userId} status: ${subscription.status}`
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Look up by subscription ID
        const { data: profile } = await adminSupabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (profile) {
          await adminSupabase
            .from('user_profiles')
            .update({
              tier: 'free',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq('id', profile.id);

          console.log(
            `[stripe-webhook] subscription.deleted → user ${profile.id} downgraded to free`
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(
          `[stripe-webhook] invoice.payment_failed for customer ${invoice.customer}`
        );
        // TODO: Send email notification, mark subscription as past_due
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] Handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
