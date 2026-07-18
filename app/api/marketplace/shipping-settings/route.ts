import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import {
  emptyMarketplaceAddress,
  type MarketplaceAddress,
  type MarketplaceDeliveryPartnerId,
} from '@/lib/marketplace-shipping'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }
    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const db = getAdminDb()
    const bizSnap = await db.collection('businesses').doc(uid).get()
    const biz = bizSnap.data() || {}
    const shipping = (biz.shipping || {}) as Record<string, unknown>
    const bankTransfer = (biz.bankTransfer || {}) as Record<string, unknown>

    return NextResponse.json({
      success: true,
      shipping: {
        preferredDeliveryPartner: shipping.preferredDeliveryPartner || 'self_arrange',
        preferredDeliveryPartnerName: shipping.preferredDeliveryPartnerName || '',
        shopAddress: shipping.shopAddress || emptyMarketplaceAddress(),
      },
      bankTransfer: {
        bankName: bankTransfer.bankName || '',
        accountName: bankTransfer.accountName || '',
        iban: bankTransfer.iban || '',
        accountNumber: bankTransfer.accountNumber || '',
        notes: bankTransfer.notes || '',
      },
    })
  } catch (error) {
    console.error('[marketplace/shipping-settings] GET:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }
    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const preferredDeliveryPartner = String(
      body.preferredDeliveryPartner || 'self_arrange'
    ) as MarketplaceDeliveryPartnerId
    const preferredDeliveryPartnerName = String(body.preferredDeliveryPartnerName || '')
    const shopAddress = (body.shopAddress || emptyMarketplaceAddress()) as MarketplaceAddress
    const bankTransfer = body.bankTransfer || {}

    const db = getAdminDb()
    const shipping = sanitizeForFirestore({
      preferredDeliveryPartner,
      preferredDeliveryPartnerName:
        preferredDeliveryPartner === 'other' ? preferredDeliveryPartnerName : null,
      shopAddress,
    })

    const bank = sanitizeForFirestore({
      bankName: String(bankTransfer.bankName || ''),
      accountName: String(bankTransfer.accountName || ''),
      iban: String(bankTransfer.iban || ''),
      accountNumber: String(bankTransfer.accountNumber || ''),
      notes: String(bankTransfer.notes || ''),
    })

    const bizRef = db.collection('businesses').doc(uid)
    await bizRef.set(
      {
        shipping,
        bankTransfer: bank,
        updatedAt: FieldValue.serverTimestamp(),
        ownerId: uid,
        userId: uid,
      },
      { merge: true }
    )

    try {
      await db.collection('users').doc(uid).update({
        'businessProfile.shipping': shipping,
        'businessProfile.bankTransfer': bank,
        updatedAt: FieldValue.serverTimestamp(),
      })
    } catch {
      /* user doc may lack businessProfile yet */
      await db.collection('users').doc(uid).set(
        {
          businessProfile: { shipping, bankTransfer: bank },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[marketplace/shipping-settings] PUT:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 }
    )
  }
}
