import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] DEBUG: Checking Firebase Admin SDK initialization...')
    
    // Import the admin access function to trigger initialization
    const { getAdminApp } = require('@/lib/admin-access-server')
    
    console.log('[v0] DEBUG: Attempting to get admin app...')
    const adminApp = getAdminApp()
    
    console.log('[v0] DEBUG: Admin app initialized successfully:', !!adminApp)
    
    return NextResponse.json({
      status: 'success',
      message: 'Firebase Admin SDK initialized successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[v0] DEBUG: Error initializing Firebase Admin SDK:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
