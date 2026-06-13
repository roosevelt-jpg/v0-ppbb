import { NextRequest, NextResponse } from 'next/server'
import { getAdminApp } from '@/lib/admin-access-server'

export async function GET(request: NextRequest) {
  try {
    console.log('[v0] DEBUG: Checking Firebase Admin SDK initialization...')
    
    console.log('[v0] DEBUG: Attempting to get admin app...')
    const adminApp = getAdminApp()
    
    console.log('[v0] DEBUG: Admin app initialized successfully:', !!adminApp)
    console.log('[v0] DEBUG: Admin app name:', adminApp.name)
    
    return NextResponse.json({
      status: 'success',
      message: 'Firebase Admin SDK initialized successfully',
      appName: adminApp.name,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[v0] DEBUG: Error initializing Firebase Admin SDK:', errorMessage)
    console.error('[v0] Stack:', errorStack)
    return NextResponse.json({
      status: 'error',
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
