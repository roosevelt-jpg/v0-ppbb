import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Acceptance counts for the current policy. */
export async function GET(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    const currentSnap = await db.collection('euDataProtectionPolicy').doc('current').get()
    if (!currentSnap.exists) {
      return NextResponse.json({
        success: true,
        data: { total: 0, currentVersion: 0, version: null, recent: [] },
      })
    }

    const current = currentSnap.data() || {}
    const policyId = String(current.id || currentSnap.id || 'current')
    const version = Number(current.version) || 0

    // Prefer simple queries so missing composite indexes don't blank the admin page
    let total = 0
    let currentVersionCount = 0
    let recent: Array<{
      id: string
      policyVersion: number | null
      userId: string | null
      acceptedAt: string | null
    }> = []

    try {
      const allSnap = await db
        .collection('policyAcceptances')
        .where('policyId', '==', policyId)
        .get()

      total = allSnap.size
      currentVersionCount = allSnap.docs.filter(
        (doc) => Number(doc.data().policyVersion) === version
      ).length

      recent = allSnap.docs
        .map((doc) => {
          const data = doc.data()
          const acceptedAt =
            data.acceptedAt?.toDate?.()?.toISOString?.() ||
            (typeof data.acceptedAt === 'string' ? data.acceptedAt : null)
          return {
            id: doc.id,
            policyVersion: data.policyVersion != null ? Number(data.policyVersion) : null,
            userId: typeof data.userId === 'string' ? data.userId : null,
            acceptedAt,
          }
        })
        .sort((a, b) => {
          const ta = a.acceptedAt ? new Date(a.acceptedAt).getTime() : 0
          const tb = b.acceptedAt ? new Date(b.acceptedAt).getTime() : 0
          return tb - ta
        })
        .slice(0, 10)
    } catch (queryError) {
      console.warn('[admin/eu-policy/acceptances] query fallback:', queryError)
      // Last resort: collection scan limited
      const fallback = await db.collection('policyAcceptances').limit(500).get()
      const matched = fallback.docs.filter((doc) => String(doc.data().policyId) === policyId)
      total = matched.length
      currentVersionCount = matched.filter(
        (doc) => Number(doc.data().policyVersion) === version
      ).length
    }

    return NextResponse.json({
      success: true,
      data: {
        total,
        currentVersion: currentVersionCount,
        version,
        recent,
      },
    })
  } catch (error) {
    console.error('[admin/eu-policy/acceptances GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to load acceptances' }, { status: 500 })
  }
}
