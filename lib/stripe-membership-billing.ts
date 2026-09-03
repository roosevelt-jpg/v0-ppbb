import type Stripe from 'stripe'

/** Recurring interval for membership auto-debit (monthly unless the plan is yearly). */
export function membershipRecurringInterval(billingPeriod: unknown): 'month' | 'year' {
  return billingPeriod === 'yearly' || billingPeriod === 'year' ? 'year' : 'month'
}

export function invoiceSubscriptionId(invoice: Stripe.Invoice | Record<string, unknown>): string {
  const rec = invoice as Record<string, unknown>
  const direct = rec.subscription
  if (typeof direct === 'string' && direct.startsWith('sub_')) return direct
  if (direct && typeof direct === 'object' && 'id' in (direct as object)) {
    const id = (direct as { id?: string }).id
    if (typeof id === 'string') return id
  }
  const parent = rec.parent as { subscription_details?: { subscription?: string | { id?: string } } } | undefined
  const nested = parent?.subscription_details?.subscription
  if (typeof nested === 'string' && nested.startsWith('sub_')) return nested
  if (nested && typeof nested === 'object' && nested.id) return nested.id
  return ''
}

export function invoicePaymentIntentId(invoice: Stripe.Invoice | Record<string, unknown>): string {
  const rec = invoice as Record<string, unknown>
  const direct = rec.payment_intent
  if (typeof direct === 'string' && direct.startsWith('pi_')) return direct
  if (direct && typeof direct === 'object' && 'id' in (direct as object)) {
    const id = (direct as { id?: string }).id
    if (typeof id === 'string') return id
  }
  return ''
}

export function subscriptionPeriodEndUnix(subscription: Stripe.Subscription | Record<string, unknown>): number | null {
  const rec = subscription as Record<string, unknown>
  const top = rec.current_period_end
  if (typeof top === 'number' && Number.isFinite(top) && top > 0) return top
  const items = rec.items as { data?: Array<{ current_period_end?: number }> } | undefined
  const fromItem = items?.data?.[0]?.current_period_end
  if (typeof fromItem === 'number' && Number.isFinite(fromItem) && fromItem > 0) return fromItem
  return null
}

/**
 * Create or reuse a Stripe Product + recurring Price so later cycles can auto-debit.
 * Replaces a stored one-time price if it was never set up as recurring.
 */
export async function ensureRecurringMembershipPrice(
  stripe: Stripe,
  plan: Record<string, unknown>,
  planId: string,
  persist: (patch: { stripeProductId?: string; stripePriceId?: string }) => Promise<void>
): Promise<{ productId: string; priceId: string }> {
  const interval = membershipRecurringInterval(plan.billingPeriod)
  let productId = typeof plan.stripeProductId === 'string' ? plan.stripeProductId : undefined

  if (productId) {
    const exists = await stripe.products.retrieve(productId).then(
      (p) => !p.deleted,
      () => false
    )
    if (!exists) productId = undefined
  }

  if (!productId) {
    const product = await stripe.products.create({
      name: String(plan.name || 'Membership'),
      description: String(plan.description || ''),
      metadata: { planId, type: 'membership' },
    })
    productId = product.id
    await persist({ stripeProductId: productId })
  }

  let priceId =
    productId === plan.stripeProductId && typeof plan.stripePriceId === 'string'
      ? plan.stripePriceId
      : undefined

  if (priceId) {
    const price = await stripe.prices.retrieve(priceId).then(
      (p) => p,
      () => null
    )
    const recurringOk = price?.recurring?.interval === interval && price.active !== false
    if (!price || !recurringOk) priceId = undefined
  }

  if (!priceId) {
    const price = await stripe.prices.create({
      unit_amount: Number(plan.price) || 0,
      currency: String(plan.currency || 'AED').toLowerCase(),
      recurring: { interval, interval_count: 1 },
      product: productId,
      metadata: { planId, type: 'membership' },
    })
    priceId = price.id
    await persist({ stripePriceId: priceId, stripeProductId: productId })
  }

  return { productId, priceId }
}

export async function clientSecretForIncompleteSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<{ clientSecret: string; mode: 'payment' | 'setup'; paymentIntentId?: string }> {
  const setupIntent = subscription.pending_setup_intent
  if (setupIntent && typeof setupIntent !== 'string' && setupIntent.client_secret) {
    return { clientSecret: setupIntent.client_secret, mode: 'setup' }
  }
  if (typeof setupIntent === 'string') {
    const retrieved = await stripe.setupIntents.retrieve(setupIntent)
    if (retrieved.client_secret) {
      return { clientSecret: retrieved.client_secret, mode: 'setup' }
    }
  }

  const latest = subscription.latest_invoice
  const invoice =
    typeof latest === 'string' ? await stripe.invoices.retrieve(latest) : latest
  if (!invoice) {
    throw new Error('Stripe did not return an invoice for this subscription')
  }

  const rec = invoice as Stripe.Invoice & {
    confirmation_secret?: { client_secret?: string }
    payment_intent?: string | Stripe.PaymentIntent | null
  }

  if (rec.confirmation_secret?.client_secret) {
    return { clientSecret: rec.confirmation_secret.client_secret, mode: 'payment' }
  }

  const piField = rec.payment_intent
  if (piField && typeof piField !== 'string' && piField.client_secret) {
    return {
      clientSecret: piField.client_secret,
      mode: 'payment',
      paymentIntentId: piField.id,
    }
  }
  if (typeof piField === 'string') {
    const pi = await stripe.paymentIntents.retrieve(piField)
    if (pi.client_secret) {
      return { clientSecret: pi.client_secret, mode: 'payment', paymentIntentId: pi.id }
    }
  }

  throw new Error('Stripe did not return a client secret for this subscription')
}

/**
 * Save the card used on this invoice as the default so Stripe can auto-debit
 * later cycles off-session (no member present).
 */
export async function attachInvoiceCardForAutoDebit(
  stripe: Stripe,
  invoice: Stripe.Invoice | Record<string, unknown>,
  subscriptionId: string
): Promise<void> {
  let paymentMethodId =
    typeof (invoice as { default_payment_method?: unknown }).default_payment_method === 'string'
      ? String((invoice as { default_payment_method: string }).default_payment_method)
      : ''

  if (!paymentMethodId && (invoice as { payment_method?: unknown }).payment_method) {
    const pm = (invoice as { payment_method?: string | { id?: string } }).payment_method
    paymentMethodId = typeof pm === 'string' ? pm : String(pm?.id || '')
  }

  const piId = invoicePaymentIntentId(invoice)
  if (!paymentMethodId && piId) {
    const pi = await stripe.paymentIntents.retrieve(piId)
    const pm = pi.payment_method
    paymentMethodId = typeof pm === 'string' ? pm : String(pm && 'id' in pm ? pm.id : '')
  }

  if (!paymentMethodId.startsWith('pm_')) return

  const customerField = (invoice as { customer?: unknown }).customer
  const customerId =
    typeof customerField === 'string'
      ? customerField
      : customerField && typeof customerField === 'object' && 'id' in customerField
        ? String((customerField as { id: string }).id)
        : ''

  if (customerId) {
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })
  }

  if (subscriptionId.startsWith('sub_')) {
    await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: paymentMethodId,
    })
  }
}
