import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getAdminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Save a pricing plan with the Admin SDK so the browser does not wait on a
 * client Firestore round-trip. Stripe is not contacted here.
 */
export async function POST(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name || body.price === undefined || body.price === null || body.price === '') {
      return NextResponse.json({ success: false, error: 'Name and price are required' }, { status: 400 })
    }
    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ success: false, error: 'Price must be a number' }, { status: 400 })
    }

    const trialMonths =
      body.trialMonths === 1 || body.trialMonths === 2 || body.trialMonths === 3 ? body.trialMonths : 0
    const billingPeriod =
      body.billingPeriod === 'yearly' || body.billingPeriod === 'year' ? body.billingPeriod : 'monthly'

    const payload: Record<string, unknown> = {
      name,
      description: String(body.description || ''),
      price,
      currency: String(body.currency || 'USD'),
      billingPeriod,
      trialMonths,
      features: Array.isArray(body.features)
        ? body.features.map((item: unknown) => String(item)).filter(Boolean)
        : [],
      benefits: [],
      icon: String(body.icon || '🎯'),
      color: String(body.color || '#111111'),
      active: body.active !== false,
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
      updatedAt: FieldValue.serverTimestamp(),
    }

    for (const key of ['paymentGateway', 'stripeProductId', 'stripePriceId', 'paypalPlanId', 'ziinaPlanId'] as const) {
      if (body[key] !== undefined && body[key] !== null && String(body[key]).trim()) {
        payload[key] = String(body[key]).trim()
      }
    }

    const db = getAdminDb()
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    if (id) {
      await db.collection('pricingPlans').doc(id).set(payload, { merge: true })
      return NextResponse.json({ success: true, id })
    }

    const ref = await db.collection('pricingPlans').add({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ success: true, id: ref.id })
  } catch (error) {
    console.error('[api/admin/pricing]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save plan' },
      { status: 500 }
    )
  }
}
