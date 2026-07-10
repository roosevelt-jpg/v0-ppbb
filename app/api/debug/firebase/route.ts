import { NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Smoke-test ID token verification (jose JWKS — no firebase-admin/auth). */
export async function GET() {
  try {
    const result = await verifyIdToken('invalid_token_for_testing')
    return NextResponse.json({
      status: 'success',
      message: 'Token verification module loaded (invalid token correctly rejected)',
      tokenVerificationResult: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        status: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
