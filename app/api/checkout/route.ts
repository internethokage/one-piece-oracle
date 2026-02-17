import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { getStripe, getOrCreateStripeCustomer, PRO_PRICE_ID } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get or create Stripe customer
    const adminSupabase = await createAdminSupabaseClient();
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email!,
      profile?.stripe_customer_id
    );

    // Persist customer ID if it's new
    if (!profile?.stripe_customer_id) {
      await adminSupabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create Stripe Checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
      metadata: {
        supabase_user_id: user.id,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[checkout] Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkout — redirect to Stripe billing portal
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: appUrl,
    });

    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    console.error('[billing-portal] Error:', error);
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 });
  }
}
