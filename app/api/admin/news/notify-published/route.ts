import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { notifyNewsPublished } from '@/lib/push-notifications-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Admin: fan-out push when a news article is published. */
export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdminFromRequest(request)
    if (!adminUid) return unauthorizedResponse()

    const body = (await request.json()) as {
      newsId?: string
      title?: string
      slug?: string
      summary?: string
    }

    if (!body.newsId || !body.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'newsId and title are required' },
        { status: 400 }
      )
    }

    const result = await notifyNewsPublished({
      newsId: body.newsId,
      title: body.title.trim(),
      slug: body.slug,
      summary: body.summary,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[v0] news publish notify failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to notify members' }, { status: 500 })
  }
}
