import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazy Stripe client — only instantiated when first used (not at build time)
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

/**
 * Get or create a Stripe customer for a Supabase user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  existingCustomerId?: string | null
): Promise<string> {
  const stripe = getStripe();

  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  return customer.id;
}

/**
 * Check if a Stripe subscription is active
 */
export function isSubscriptionActive(
  status: Stripe.Subscription.Status
): boolean {
  return ['active', 'trialing'].includes(status);
}
