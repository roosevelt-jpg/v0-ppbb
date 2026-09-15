import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminApp } from '@/lib/firebase-admin'
import { firestoreEmailIsReleased } from '@/lib/account-delete'

export const runtime = 'nodejs'

/** Server-side email check — Auth + Firestore (client cannot query users collection). */
export async function GET(request: NextRequest) {
  try {
    const email = (request.nextUrl.searchParams.get('email') || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 })
    }

    const db = getAdminDb()
    const snap = await db.collection('users').where('email', '==', email).limit(5).get()
    const blockingDoc = snap.docs.find(
      (d) => !firestoreEmailIsReleased(d.data() as Record<string, unknown>)
    )
    const firestoreUser = blockingDoc
      ? { id: blockingDoc.id, ...blockingDoc.data() }
      : null

    let authUser: { providers: string[]; uid: string } | null = null
    try {
      // Dynamic import: top-level firebase-admin/auth can crash the serverless module.
      const { getAuth } = await import('firebase-admin/auth')
      const auth = getAuth(getAdminApp())
      const record = await auth.getUserByEmail(email)
      if (record.disabled) {
        // Previous soft-delete left a disabled Auth user — remove so signup can reuse the email.
        try {
          await auth.deleteUser(record.uid)
        } catch (delErr) {
          console.warn('[auth/check-email] Could not delete disabled Auth user:', delErr)
          authUser = {
            uid: record.uid,
            providers: record.providerData.map((p) => p.providerId).filter(Boolean),
          }
        }
      } else {
        authUser = {
          uid: record.uid,
          providers: record.providerData.map((p) => p.providerId).filter(Boolean),
        }
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
      available: !firestoreUser && !authUser,
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
