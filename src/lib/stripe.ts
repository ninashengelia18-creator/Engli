import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true
});

export const STRIPE_PRICES = {
  premium_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY!,
  premium_annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_ANNUAL!,
  family_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_MONTHLY!
} as const;

export type PriceKey = keyof typeof STRIPE_PRICES;
