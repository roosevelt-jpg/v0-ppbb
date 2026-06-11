import { NextRequest, NextResponse } from 'next/server'
import { cancelSubscription } from '@/lib/stripe-utils'
import { db } from '@/lib/firebase'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    // Cancel via Stripe
    await cancelSubscription(subscriptionId)

    // Update Firestore
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Error cancelling subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
