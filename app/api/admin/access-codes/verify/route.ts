import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessCode } from '@/lib/admin-login-tracking'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      )
    }

    // Get IP address and location info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('cf-connecting-ip') || 
                      'unknown'
    
    const location = request.headers.get('cf-ipcountry') || undefined

    // Verify the access code
    const result = await verifyAccessCode(code.toUpperCase(), ipAddress, location)

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Invalid access code' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      accessCode: result.accessCode,
      adminEmail: result.accessCode?.adminEmail,
      adminRole: result.accessCode?.adminRole,
      permissions: result.accessCode?.permissions,
    })
  } catch (error) {
    console.error('[v0] Access code verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
