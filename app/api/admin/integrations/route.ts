import { NextRequest, NextResponse } from 'next/server'
import { getAllApiConfigs, checkAllServicesHealth } from '@/lib/api-config'

export async function GET(request: NextRequest) {
  try {
    const [configs, health] = await Promise.all([
      getAllApiConfigs(),
      checkAllServicesHealth(),
    ])
    return NextResponse.json({
      success: true,
      configs,
      health,
      total: configs.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching API configs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API configurations' },
      { status: 500 }
    )
  }
}
