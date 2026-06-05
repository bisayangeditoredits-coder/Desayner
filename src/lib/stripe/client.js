import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

/**
 * Stripe server-side client.
 * Use this in API routes and Server Actions only.
 * NEVER import this in client components.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

/**
 * Stripe browser client (Promise).
 * Singleton pattern — loadStripe is only called once.
 * Safe to use in Client Components.
 */
let stripePromise;
export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

/**
 * Create a Stripe Checkout Session for the Pro plan.
 * Call this from a Server Action or API Route.
 *
 * @param {string} userId - The Supabase user ID (stored in Stripe metadata).
 * @param {string} email  - The user's email for pre-filling checkout.
 * @returns {Promise<string>} The Stripe Checkout Session URL to redirect to.
 */
export async function createCheckoutSession(userId, email) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    metadata: { userId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?upgraded=true`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/`,
  });

  return session.url;
}

/**
 * Create a Stripe Billing Portal session so users can manage their subscription.
 * @param {string} stripeCustomerId - The user's Stripe customer ID.
 * @returns {Promise<string>} The Billing Portal URL.
 */
export async function createBillingPortalSession(stripeCustomerId) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
  });

  return session.url;
}
