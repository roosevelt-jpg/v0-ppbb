import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import {
  createMembershipPromoCode,
  listMembershipPromoCodes,
  resolvePromoStatus,
  updateMembershipPromoCode,
  type MembershipPromoStatus,
  type MembershipPromoType,
} from '@/lib/membership-promo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function serializePromo(promo: Awaited<ReturnType<typeof listMembershipPromoCodes>>[number]) {
  const status = resolvePromoStatus(promo)
  return {
    ...promo,
    status,
    codeExpiresAt: promo.codeExpiresAt?.toISOString() || null,
    createdAt: promo.createdAt?.toISOString() || null,
    updatedAt: promo.updatedAt?.toISOString() || null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const codes = await listMembershipPromoCodes()
    return NextResponse.json({ success: true, data: codes.map(serializePromo) })
  } catch (error) {
    console.error('[api/admin/promo-codes GET]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list promo codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const type: MembershipPromoType =
      body.type === 'percent_off' ? 'percent_off' : 'free_access'
    const codeExpiresAt =
      body.codeExpiresAt && String(body.codeExpiresAt).trim()
        ? new Date(String(body.codeExpiresAt))
        : null
    if (codeExpiresAt && Number.isNaN(codeExpiresAt.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid code expiry date' }, { status: 400 })
    }

    const maxRaw = body.maxRedemptions
    const maxRedemptions =
      maxRaw === null || maxRaw === undefined || maxRaw === ''
        ? null
        : Math.floor(Number(maxRaw))

    const promo = await createMembershipPromoCode({
      code: String(body.code || ''),
      label: body.label ? String(body.label) : undefined,
      description: body.description ? String(body.description) : undefined,
      type,
      percentOff: type === 'percent_off' ? Number(body.percentOff) : 100,
      planId: String(body.planId || ''),
      benefitDurationMonths:
        body.benefitDurationMonths === 'forever' || body.benefitDurationMonths === 0
          ? 0
          : Number(body.benefitDurationMonths) || 1,
      trialEnabled: body.trialEnabled === true,
      maxRedemptions,
      codeExpiresAt,
      createdBy: uid,
    })

    return NextResponse.json({ success: true, data: serializePromo(promo) })
  } catch (error) {
    console.error('[api/admin/promo-codes POST]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create promo code' },
      { status: 400 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = String(body.id || '').trim()
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }

    const patch: Parameters<typeof updateMembershipPromoCode>[1] = {}
    if (body.label !== undefined) patch.label = String(body.label)
    if (body.description !== undefined) patch.description = String(body.description)
    if (body.status !== undefined) {
      const status = String(body.status) as MembershipPromoStatus
      if (!['active', 'paused', 'exhausted', 'expired'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
      }
      patch.status = status
    }
    if (body.codeExpiresAt !== undefined) {
      if (body.codeExpiresAt === null || body.codeExpiresAt === '') {
        patch.codeExpiresAt = null
      } else {
        const d = new Date(String(body.codeExpiresAt))
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ success: false, error: 'Invalid code expiry date' }, { status: 400 })
        }
        patch.codeExpiresAt = d
      }
    }
    if (body.maxRedemptions !== undefined) {
      patch.maxRedemptions =
        body.maxRedemptions === null || body.maxRedemptions === ''
          ? null
          : Math.floor(Number(body.maxRedemptions))
    }
    if (body.benefitDurationMonths !== undefined) {
      patch.benefitDurationMonths = Number(body.benefitDurationMonths)
    }
    if (body.trialEnabled !== undefined) {
      patch.trialEnabled = body.trialEnabled === true
    }

    const promo = await updateMembershipPromoCode(id, patch)
    return NextResponse.json({ success: true, data: serializePromo(promo) })
  } catch (error) {
    console.error('[api/admin/promo-codes PATCH]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update promo code' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const id = request.nextUrl.searchParams.get('id') || ''
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }
    // Soft-pause so redemption history / usedCount stay auditable
    const promo = await updateMembershipPromoCode(id, { status: 'paused' })
    return NextResponse.json({ success: true, data: serializePromo(promo) })
  } catch (error) {
    console.error('[api/admin/promo-codes DELETE]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to pause promo code' },
      { status: 400 }
    )
  }
}
