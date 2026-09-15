import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { getChatbotDiagnostics } from '@/lib/chatbot-diagnostics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Admin-only: Anthropic + FAQ/knowledge status for PB Assistant. */
export async function GET(request: NextRequest) {
  try {
    const adminUid = await requireAdminFromRequest(request)
    if (!adminUid) return unauthorizedResponse()

    const probe = request.nextUrl.searchParams.get('probe') === '1'
    const diagnostics = await getChatbotDiagnostics({ probe })

    return NextResponse.json({ success: true, data: diagnostics })
  } catch (error) {
    console.error('[v0] chatbot diagnostics error:', error)
    return NextResponse.json({ success: false, error: 'Failed to run diagnostics' }, { status: 500 })
  }
}
