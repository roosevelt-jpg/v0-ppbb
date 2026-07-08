import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  verifyUnsubscribeToken,
  recordNewsletterUnsubscribe,
} from '@/lib/newsletter-unsubscribe'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const email = searchParams.get('email') || ''
    const token = searchParams.get('token') || ''

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token are required' }, { status: 400 })
    }

    if (!verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ error: 'Invalid unsubscribe link' }, { status: 403 })
    }

    await recordNewsletterUnsubscribe(email)

    // Sync legacy newsletter_subscribers if present
    const db = getAdminDb()
    const subsSnap = await db
      .collection('newsletter_subscribers')
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get()

    if (!subsSnap.empty) {
      await subsSnap.docs[0].ref.update({
        unsubscribedAt: new Date(),
        isActive: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'You have been successfully unsubscribed from Passive Blessings newsletters.',
    })
  } catch (error) {
    console.error('[v0] Newsletter unsubscribe GET error:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body as { email?: string; token?: string }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (token && !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    await recordNewsletterUnsubscribe(email)

    const db = getAdminDb()
    const subsSnap = await db
      .collection('newsletter_subscribers')
      .where('email', '==', email.trim().toLowerCase())
      .limit(1)
      .get()

    if (!subsSnap.empty) {
      await subsSnap.docs[0].ref.update({
        unsubscribedAt: new Date(),
        isActive: false,
      })
      return NextResponse.json({
        success: true,
        message: 'Successfully unsubscribed from newsletter',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    })
  } catch (error) {
    console.error('[v0] Error unsubscribing from newsletter:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
