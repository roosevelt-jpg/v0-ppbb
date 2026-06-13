import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] DEBUG: Testing Firebase Admin SDK initialization via verifyIdToken...')
    
    // Use an invalid token just to trigger the initialization
    const result = await verifyIdToken('invalid_token_for_testing')
    
    console.log('[v0] DEBUG: verifyIdToken completed (result should be null for invalid token):', result)
    
    return NextResponse.json({
      status: 'success',
      message: 'Firebase Admin SDK initialized successfully and token verification attempted',
      tokenVerificationResult: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[v0] DEBUG: Error during Firebase initialization/verification:', errorMessage)
    console.error('[v0] Stack:', errorStack)
    return NextResponse.json({
      status: 'error',
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
