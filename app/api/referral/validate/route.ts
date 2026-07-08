import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  DEFAULT_REFERRALS_CONFIG,
  mergeReferralsConfig,
} from '@/lib/referral-config'

/**
 * Public (no auth) — validate a referral code exists on an approved business.
 * Used by global ?ref= attribution capture so Client SDK does not need a
 * collection-query against businesses security rules.
 */
export async function GET(request: NextRequest) {
  try {
    const code = (request.nextUrl.searchParams.get('code') || '').trim()
    if (!code || code.length > 64) {
      return NextResponse.json({ success: true, valid: false })
    }

    const db = getAdminDb()
    const snap = await db
      .collection('businesses')
      .where('referralCode', '==', code)
      .limit(1)
      .get()

    if (snap.empty) {
      return NextResponse.json({ success: true, valid: false })
    }

    const data = snap.docs[0].data()
    const valid = data.isApproved === true && data.isActive !== false

    let attributionWindowDays = DEFAULT_REFERRALS_CONFIG.attributionWindowDays
    try {
      const cfg = await db.collection('platformConfig').doc('referrals').get()
      if (cfg.exists) {
        attributionWindowDays = mergeReferralsConfig(cfg.data()).attributionWindowDays
      }
    } catch {
      /* defaults */
    }

    return NextResponse.json({
      success: true,
      valid,
      attributionWindowDays: valid ? attributionWindowDays : null,
    })
  } catch (error) {
    console.error('[referral/validate]', error)
    return NextResponse.json({ success: true, valid: false })
  }
}
