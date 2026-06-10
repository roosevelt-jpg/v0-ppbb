import { NextResponse } from 'next/server'
import { initializePolicies } from '@/lib/policy-manager'

export async function GET() {
  try {
    await initializePolicies()
    return NextResponse.json({ success: true, message: 'Policies initialized' })
  } catch (error: any) {
    console.error('[v0] Error initializing policies:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
