import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { verifyAdminLoginOtp } from '@/lib/admin-login-otp'
import { FirebaseAdminConfigError } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Verify the 6-digit admin login code (step 3).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let isAdmin: boolean
    try {
      isAdmin = await isAdminUser(uid)
    } catch (error) {
      if (error instanceof FirebaseAdminConfigError) {
        console.error('[admin/login/verify-otp]', error.message)
        return NextResponse.json(
          {
            success: false,
            error:
              'Server is missing Firebase Admin credentials (FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY, or GCP_SERVICE_ACCOUNT). Set these in .env.production.local on the server and restart the app.',
          },
          { status: 500 }
        )
      }
      throw error
    }
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Not an admin account' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const code = String(body.code || '').trim()
    const result = await verifyAdminLoginOtp({ uid, code })
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid code' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Login verified' })
  } catch (error) {
    console.error('[admin/login/verify-otp]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify login code' },
      { status: 500 }
    )
  }
}
