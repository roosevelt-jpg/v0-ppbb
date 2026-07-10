import { NextRequest, NextResponse } from 'next/server'
import { getNewsletterRecipientCount } from '@/lib/newsletter-recipients'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'

export async function GET(request: NextRequest) {
  try {
    const adminUid = await requireAdminFromRequest(request)
    if (!adminUid) return unauthorizedResponse()

    const count = await getNewsletterRecipientCount()
    return NextResponse.json({ count })
  } catch (error) {
    console.error('[v0] Newsletter recipients count error:', error)
    return NextResponse.json({ error: 'Failed to load recipient count' }, { status: 500 })
  }
}
