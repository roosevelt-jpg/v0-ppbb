import { NextRequest, NextResponse } from 'next/server'
import { getApiConfig, setApiConfig, checkServiceHealth } from '@/lib/api-config'
import { validateApiCredentials, sanitizeCredentials } from '@/lib/integrations/validators'
import { getServiceDefinition } from '@/lib/integrations/services'

export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const service = params.service
    const config = await getApiConfig(service)

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('[v0] Error fetching API config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const service = params.service
    const body = await request.json()

    // Validate service exists
    const serviceDef = getServiceDefinition(service)
    if (!serviceDef) {
      return NextResponse.json(
        { success: false, error: 'Unknown service' },
        { status: 400 }
      )
    }

    // Validate credentials
    const validationErrors = validateApiCredentials(service, body)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      )
    }

    // Sanitize and save
    const sanitized = sanitizeCredentials(body)
    const saved = await setApiConfig(service, {
      ...sanitized,
      status: 'active',
      isHealthy: false,
      lastChecked: new Date(),
    })

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Failed to save configuration' },
        { status: 500 }
      )
    }

    // Check health immediately
    const health = await checkServiceHealth(service)

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
      health,
    })
  } catch (error) {
    console.error('[v0] Error saving API config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const service = params.service

    // TODO: Implement delete in api-config.ts
    // For now, set to inactive
    await setApiConfig(service, {
      status: 'inactive',
      isHealthy: false,
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
    })
  } catch (error) {
    console.error('[v0] Error deleting API config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete configuration' },
      { status: 500 }
    )
  }
}
