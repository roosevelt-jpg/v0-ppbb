import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

/** Server-side email uniqueness check (client cannot query users collection). */
export async function GET(request: NextRequest) {
  try {
    const email = (request.nextUrl.searchParams.get('email') || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 })
    }

    const db = getAdminDb()
    const snap = await db.collection('users').where('email', '==', email).limit(1).get()

    return NextResponse.json({
      success: true,
      available: snap.empty,
    })
  } catch (error) {
    console.error('[auth/check-email]', error)
    return NextResponse.json({ success: false, error: 'Failed to check email' }, { status: 500 })
  }
}
