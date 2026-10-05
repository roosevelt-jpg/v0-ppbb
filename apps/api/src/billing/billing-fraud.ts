/** Fraud / abuse thresholds for Stripe billing. */

export const BILLING_FRAUD = {
  /** Max checkout/setup sessions per org in the rolling window. */
  maxCheckoutAttempts: Number(process.env.BILLING_MAX_CHECKOUT_ATTEMPTS ?? 8),
  /** Rolling window for checkout attempt counting (ms). */
  checkoutWindowMs: Number(process.env.BILLING_CHECKOUT_WINDOW_MS ?? 60 * 60 * 1000),
  /** Consecutive payment failures before hard fraud hold. */
  maxPaymentFailures: Number(process.env.BILLING_MAX_PAYMENT_FAILURES ?? 3),
  /** Statuses that block new paid checkouts and metered API use. */
  blockedStatuses: new Set(['fraud_hold', 'unpaid']),
};

export function isBillingBlocked(status: string): boolean {
  return BILLING_FRAUD.blockedStatuses.has(status);
}
