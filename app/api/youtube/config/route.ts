import { NextResponse } from 'next/server'
import { getYouTubeConfigServer, saveAndRefreshYouTube } from '@/lib/youtube-server'

export const dynamic = 'force-dynamic'

// Public read — used by the homepage Featured Videos section.
export async function GET() {
  try {
    const config = await getYouTubeConfigServer()
    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('[v0] YouTube config GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load configuration' }, { status: 500 })
  }
}

// Admin save — normalizes the channel ID, fetches videos, stores via Admin SDK.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { config, error } = await saveAndRefreshYouTube(body)
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('[v0] YouTube config POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save configuration' }, { status: 500 })
  }
}
