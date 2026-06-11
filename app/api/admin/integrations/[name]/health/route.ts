import { NextRequest, NextResponse } from 'next/server'
import { checkServiceHealth } from '@/lib/api-config'

export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const serviceName = params.name
    const health = await checkServiceHealth(serviceName)

    return NextResponse.json({
      health,
      message: `Health check completed for ${serviceName}`,
    })
  } catch (error) {
    console.error('[v0] Error checking service health:', error)
    return NextResponse.json(
      { error: 'Failed to check service health' },
      { status: 500 }
    )
  }
}
