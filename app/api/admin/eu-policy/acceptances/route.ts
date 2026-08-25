import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Acceptance counts for the current policy, so admins can see the tracking this page promises. */
export async function GET(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    const currentSnap = await db.collection('euDataProtectionPolicy').doc('current').get()
    const current = currentSnap.exists ? currentSnap.data() : null
    if (!current) {
      return NextResponse.json({ success: true, data: { total: 0, currentVersion: 0, recent: [] } })
    }

    const acceptancesRef = db.collection('policyAcceptances').where('policyId', '==', current.id)
    const [totalSnap, currentVersionSnap, recentSnap] = await Promise.all([
      acceptancesRef.count().get(),
      acceptancesRef.where('policyVersion', '==', current.version).count().get(),
      acceptancesRef.orderBy('acceptedAt', 'desc').limit(10).get(),
    ])

    const recent = recentSnap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        policyVersion: data.policyVersion ?? null,
        userId: data.userId ?? null,
        acceptedAt: data.acceptedAt?.toDate?.()?.toISOString?.() ?? null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        total: totalSnap.data().count,
        currentVersion: currentVersionSnap.data().count,
        recent,
      },
    })
  } catch (error) {
    console.error('[admin/eu-policy/acceptances GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to load acceptances' }, { status: 500 })
  }
}
