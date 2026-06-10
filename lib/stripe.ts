import Stripe from 'stripe'

let db: any = null
let firebaseImports: any = null

// Lazy initialize Firebase on first use
async function initFirebase() {
  if (!firebaseImports) {
    try {
      const firebase = await import('@/lib/firebase')
      db = firebase.db
      firebaseImports = await import('firebase/firestore')
      return true
    } catch (error) {
      console.warn('[v0] Firebase initialization skipped')
      return false
    }
  }
  return !!firebaseImports
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
})

export async function createPaymentIntent(
  amount: number,
  currency: string = 'aed',
  metadata?: Record<string, string>
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency,
      metadata,
    })
    return paymentIntent
  } catch (error) {
    console.error('[v0] Error creating payment intent:', error)
    throw error
  }
}

export async function recordDonation(
  donorId: string,
  campaignId: string,
  amount: number,
  stripeTransactionId: string,
  isAnonymous: boolean = false
) {
  try {
    const initialized = await initFirebase()
    if (!initialized) return null

    const { Donation } = require('@/lib/types')
    const { doc, setDoc } = firebaseImports

    const donation = {
      id: `${Date.now()}-${Math.random()}`,
      donorId,
      campaignId,
      amount,
      currency: 'AED',
      paymentMethod: 'card',
      status: 'completed',
      stripeTransactionId,
      isAnonymous,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(doc(db, 'donations', donation.id), donation)
    return donation
  } catch (error) {
    console.error('[v0] Error recording donation:', error)
    throw error
  }
}

export async function getDonations(donorId?: string, campaignId?: string) {
  try {
    const initialized = await initFirebase()
    if (!initialized) return []

    const { collection, query, where, getDocs } = firebaseImports
    let constraints = []

    if (donorId) {
      constraints.push(where('donorId', '==', donorId))
    }

    if (campaignId) {
      constraints.push(where('campaignId', '==', campaignId))
    }

    const q = query(collection(db, 'donations'), ...constraints)
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('[v0] Error fetching donations:', error)
    return []
  }
}

export async function verifyStripeWebhook(
  body: string,
  signature: string
): Promise<Stripe.Event | null> {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
    return event
  } catch (error) {
    console.error('[v0] Webhook verification error:', error)
    return null
  }
}
