import { NextRequest, NextResponse } from 'next/server'
import { getYouTubeConfigServer, saveAndRefreshYouTube } from '@/lib/youtube-server'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    // Verify the request is authorized with a token or scheduler secret
    const expectedToken = process.env.YOUTUBE_REFRESH_TOKEN
    const cronSecret = request.headers.get('x-vercel-cron-secret')
    
    // Allow from the scheduler or with a valid token
    if (cronSecret !== process.env.CRON_SECRET && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current YouTube config
    const config = await getYouTubeConfigServer()
    
    if (!config || !config.channelId || !config.apiKey) {
      return NextResponse.json(
        { error: 'YouTube configuration not found or incomplete' },
        { status: 400 }
      )
    }

    // Re-fetch and persist the latest videos
    const { config: updatedConfig, error } = await saveAndRefreshYouTube(config)
    
    if (error || !updatedConfig) {
      return NextResponse.json(
        { error: error || 'Failed to update YouTube videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'YouTube videos updated successfully',
      videosCount: updatedConfig.videos?.length || 0,
      lastFetched: updatedConfig.lastFetched,
    })
  } catch (error) {
    console.error('[youtube-refresh] Error in YouTube refresh API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering from admin panel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminToken } = body

    // Verify admin token
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current YouTube config
    const config = await getYouTubeConfigServer()
    
    if (!config || !config.channelId || !config.apiKey) {
      return NextResponse.json(
        { error: 'YouTube configuration not found or incomplete' },
        { status: 400 }
      )
    }

    // Re-fetch and persist the latest videos
    const { config: updatedConfig, error } = await saveAndRefreshYouTube(config)
    
    if (error || !updatedConfig) {
      return NextResponse.json(
        { error: error || 'Failed to update YouTube videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'YouTube videos updated successfully',
      videosCount: updatedConfig.videos?.length || 0,
      lastFetched: updatedConfig.lastFetched,
    })
  } catch (error) {
    console.error('[youtube-refresh] Error in YouTube refresh API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
