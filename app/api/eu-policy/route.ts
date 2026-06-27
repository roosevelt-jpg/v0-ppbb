import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

function serialize(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && typeof (v as any).toDate === 'function') {
      out[k] = (v as any).toDate().toISOString()
    } else {
      out[k] = v
    }
  }
  return out
}

/**
 * Public read of the current EU Data Protection Policy via the Admin SDK.
 * Client-side reads of `euDataProtectionPolicy` are denied by deployed rules.
 */
export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection('euDataProtectionPolicy').doc('current').get()
    if (!snap.exists) {
      return NextResponse.json({ success: true, data: null })
    }
    return NextResponse.json({ success: true, data: { id: snap.id, ...serialize(snap.data() as any) } })
  } catch (error) {
    console.error('[v0] /api/eu-policy GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load policy', data: null }, { status: 500 })
  }
}
