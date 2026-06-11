import { NextRequest, NextResponse } from 'next/server'
import { pauseSubscription } from '@/lib/stripe-utils'
import { db } from '@/lib/firebase'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    // Pause via Stripe
    await pauseSubscription(subscriptionId)

    // Update Firestore
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      status: 'paused',
      pausedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Error pausing subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
