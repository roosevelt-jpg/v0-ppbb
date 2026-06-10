import { NextRequest, NextResponse } from 'next/server'
import { getYouTubeConfig, updateYouTubeVideos } from '@/lib/youtube-service'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    // Verify the request is authorized (using a simple token or from Vercel Cron)
    const expectedToken = process.env.YOUTUBE_REFRESH_TOKEN
    const cronSecret = request.headers.get('x-vercel-cron-secret')
    
    // Allow from Vercel Cron or with valid token
    if (cronSecret !== process.env.CRON_SECRET && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current YouTube config
    const config = await getYouTubeConfig()
    
    if (!config || !config.channelId || !config.apiKey) {
      return NextResponse.json(
        { error: 'YouTube configuration not found or incomplete' },
        { status: 400 }
      )
    }

    // Update YouTube videos
    const updatedConfig = await updateYouTubeVideos(config)
    
    if (!updatedConfig) {
      return NextResponse.json(
        { error: 'Failed to update YouTube videos' },
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
    console.error('[v0] Error in YouTube refresh API:', error)
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
    const config = await getYouTubeConfig()
    
    if (!config || !config.channelId || !config.apiKey) {
      return NextResponse.json(
        { error: 'YouTube configuration not found or incomplete' },
        { status: 400 }
      )
    }

    // Update YouTube videos
    const updatedConfig = await updateYouTubeVideos(config)
    
    if (!updatedConfig) {
      return NextResponse.json(
        { error: 'Failed to update YouTube videos' },
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
    console.error('[v0] Error in YouTube refresh API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
