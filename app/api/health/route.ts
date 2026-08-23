import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public, secret-free readiness check. Reports which required server env
 * vars are missing (names only, never values) so a broken deploy — e.g. a
 * fresh AWS box without .env.production.local filled in — can be diagnosed
 * from the browser without SSH/console access.
 */
export async function GET() {
  const hasGcpJson = Boolean(process.env.GCP_SERVICE_ACCOUNT?.trim())
  const firebaseAdminMissing = hasGcpJson
    ? []
    : (
        [
          !(process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
            'FIREBASE_ADMIN_PROJECT_ID',
          !process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 'FIREBASE_ADMIN_CLIENT_EMAIL',
          !process.env.FIREBASE_ADMIN_PRIVATE_KEY && 'FIREBASE_ADMIN_PRIVATE_KEY',
        ] as const
      ).filter((v): v is string => Boolean(v))

  const firebaseClientConfigured = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )

  return NextResponse.json({
    ok: firebaseAdminMissing.length === 0 && firebaseClientConfigured,
    firebaseAdmin: {
      configured: firebaseAdminMissing.length === 0,
      missing: firebaseAdminMissing,
    },
    firebaseClient: {
      configured: firebaseClientConfigured,
    },
  })
}
