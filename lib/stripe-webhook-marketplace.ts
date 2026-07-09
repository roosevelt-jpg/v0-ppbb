import type Stripe from 'stripe'

export async function handleMarketplaceCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.type !== 'marketplace') return false

  const offerId = session.metadata.offerId
  const userId = session.metadata.userId
  if (!offerId || !userId) {
    console.error('[stripe webhook] marketplace session missing metadata')
    return true
  }

  const pending = await findPendingOrderByStripeSession(session.id)
  const paymentReference =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || session.id

  await completeMarketplacePurchase({
    offerId,
    buyerId: userId,
    mode: 'purchase',
    paymentReference,
    paymentGateway: 'stripe',
    orderId: pending?.id,
    stripeSessionId: session.id,
  })

  return true
}

export async function constructStripeWebhookEvent(body: Buffer, signature: string) {
  const stripe = await getStripeClient()
  const { resolveStripeConfig } = await import('@/lib/resolve-stripe-key')
  const config = await resolveStripeConfig()
  if (!config?.webhookSecret) {
    throw new Error('Stripe webhook secret is not configured')
  }
  return stripe.webhooks.constructEvent(body, signature, config.webhookSecret)
}

export async function markCheckoutSessionProcessed(sessionId: string) {
  const db = getAdminDb()
  await db.collection('processedStripeSessions').doc(sessionId).set({
    processedAt: new Date(),
    type: 'marketplace',
  })
}

export async function isCheckoutSessionProcessed(sessionId: string): Promise<boolean> {
  const db = getAdminDb()
  const snap = await db.collection('processedStripeSessions').doc(sessionId).get()
  return snap.exists
}
