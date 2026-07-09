import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getAdminDb, getAdminApp } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

/** Server-side email check — Auth + Firestore (client cannot query users collection). */
export async function GET(request: NextRequest) {
  try {
    const email = (request.nextUrl.searchParams.get('email') || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 })
    }

    const db = getAdminDb()
    const snap = await db.collection('users').where('email', '==', email).limit(1).get()
    const firestoreUser = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }

    let authUser: { providers: string[]; uid: string } | null = null
    try {
      const record = await getAuth(getAdminApp()).getUserByEmail(email)
      authUser = {
        uid: record.uid,
        providers: record.providerData.map((p) => p.providerId).filter(Boolean),
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code !== 'auth/user-not-found') {
        console.warn('[auth/check-email] Auth lookup:', err)
      }
    }

    const hasPassword = authUser?.providers.includes('password') ?? false
    const hasGoogle = authUser?.providers.includes('google.com') ?? false

    return NextResponse.json({
      success: true,
      available: snap.empty && !authUser,
      authExists: Boolean(authUser),
      firestoreExists: Boolean(firestoreUser),
      hasPassword,
      hasGoogle,
      providers: authUser?.providers ?? [],
      role: (firestoreUser as { role?: string } | null)?.role ?? null,
      uid: authUser?.uid ?? (firestoreUser as { id?: string } | null)?.id ?? null,
    })
  } catch (error) {
    console.error('[auth/check-email]', error)
    return NextResponse.json({ success: false, error: 'Failed to check email' }, { status: 500 })
  }
}
