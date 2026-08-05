import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { ensureHostingDoc, getHostingRecord } from '@/lib/hosting-server'
import { resolveStripeHostingConfig } from '@/lib/resolve-stripe-hosting'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const hosting = await getHostingRecord()
    const stripeConfigured = Boolean(await resolveStripeHostingConfig())

    return NextResponse.json({
      success: true,
      data: {
        ...hosting,
        stripeConfigured,
      },
    })
  } catch (error) {
    console.error('[api/admin/hosting GET]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load hosting' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const hosting = await ensureHostingDoc()
    return NextResponse.json({ success: true, data: hosting })
  } catch (error) {
    console.error('[api/admin/hosting PUT]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to init hosting' },
      { status: 500 }
    )
  }
}
