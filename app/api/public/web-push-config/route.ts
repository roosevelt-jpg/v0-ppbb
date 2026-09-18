import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public Web Push config. The VAPID *public* key is safe to expose to browsers
 * (it is designed for client-side FCM getToken).
 */
export async function GET() {
  try {
    const fromEnv =
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() ||
      process.env.FIREBASE_VAPID_KEY?.trim() ||
      ''

    let fromStore = ''
    try {
      const snap = await getAdminDb().collection('platformConfig').doc('globalSettings').get()
      const data = snap.data() as Record<string, unknown> | undefined
      const key = data?.firebaseVapidKey
      if (typeof key === 'string' && key.trim()) fromStore = key.trim()
    } catch (error) {
      console.warn('[web-push-config] Firestore read failed:', error)
    }

    const vapidKey = fromEnv || fromStore
    return NextResponse.json(
      {
        vapidKey: vapidKey || null,
        configured: Boolean(vapidKey),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        },
      }
    )
  } catch (error) {
    console.error('[web-push-config] error:', error)
    return NextResponse.json({ vapidKey: null, configured: false }, { status: 500 })
  }
}
