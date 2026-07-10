import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const COLLECTION = 'adminAccessCodes'

/**
 * Validate an invite access code without marking it used (setup step 1).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = String(body.code || '').trim().toUpperCase()

    if (!code) {
      return NextResponse.json({ success: false, error: 'Access code is required' }, { status: 400 })
    }

    const db = getAdminDb()
    const snapshot = await db
      .collection(COLLECTION)
      .where('code', '==', code)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Invalid or already used access code' },
        { status: 401 }
      )
    }

    const docSnap = snapshot.docs[0]
    const data = docSnap.data()

    const isUsed = data.isUsed === true || data.used === true || data.status === 'used'
    if (isUsed) {
      return NextResponse.json(
        { success: false, error: 'This access code has already been used' },
        { status: 401 }
      )
    }

    const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt)
    if (expiresAt && new Date() > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Access code has expired' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: docSnap.id,
        code,
        adminEmail: data.adminEmail || data.email || '',
        adminName: data.adminName || '',
        adminRole: data.adminRole || data.role || 'admin',
        permissions: Array.isArray(data.permissions) ? data.permissions : ['full_access'],
        expiresAt: expiresAt?.toISOString?.() || expiresAt,
      },
    })
  } catch (error) {
    console.error('[v0] Access code validate error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate access code' },
      { status: 500 }
    )
  }
}
