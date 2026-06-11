import { NextRequest, NextResponse } from 'next/server'
import { checkServiceHealth } from '@/lib/api-config'
import { getServiceDefinition } from '@/lib/integrations/services'

export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const service = params.service

    // Validate service exists
    const serviceDef = getServiceDefinition(service)
    if (!serviceDef) {
      return NextResponse.json(
        { success: false, error: 'Unknown service' },
        { status: 400 }
      )
    }

    // Check health
    const health = await checkServiceHealth(service)

    return NextResponse.json({
      success: true,
      health,
    })
  } catch (error) {
    console.error('[v0] Error checking health:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check health' },
      { status: 500 }
    )
  }
}
