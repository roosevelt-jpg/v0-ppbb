import { NextRequest, NextResponse } from 'next/server'
import { getAllApiConfigs } from '@/lib/api-config'

export async function GET(request: NextRequest) {
  try {
    const configs = await getAllApiConfigs()
    return NextResponse.json({ configs })
  } catch (error) {
    console.error('[v0] Error fetching API configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API configurations' },
      { status: 500 }
    )
  }
}
