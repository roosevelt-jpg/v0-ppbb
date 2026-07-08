import { NextRequest, NextResponse } from 'next/server'
import type { Firestore } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

type BusinessAction = 'approve' | 'verify' | 'suspend' | 'feature' | 'unfeature' | 'delete'

function asDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybe = value as { toDate?: () => Date }
    if (typeof maybe.toDate === 'function') return maybe.toDate()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function mapBusinessDoc(id: string, data: Record<string, unknown>) {
  const isApproved = data.isApproved === true
  return {
    id,
    name: asString(data.name) || asString(data.businessName) || 'Untitled',
    businessName: asString(data.name) || asString(data.businessName) || 'Untitled',
    category: asString(data.category) || asString(data.businessType),
    description: asString(data.description),
    ownerName: asString(data.ownerName) || asString(data.memberName),
    ownerId: asString(data.ownerId) || asString(data.userId),
    email: asString(data.email),
    phone: asString(data.phone),
    location: asString(data.location),
    website: asString(data.website),
    logoURL: asString(data.logoURL) || asString(data.logo),
    bannerURL: asString(data.bannerURL) || asString(data.banner),
    services: Array.isArray(data.services) ? data.services : [],
    productImages: Array.isArray(data.productImages) ? data.productImages : [],
    tradeLicenceURL: asString(data.tradeLicenceURL),
    communityBenefit: asString(data.communityBenefit),
    isApproved,
    isActive: data.isActive !== false,
    isVerified: data.isVerified === true,
    featured: data.featured === true,
    status: asString(data.status) || (isApproved ? 'approved' : 'pending_review'),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  }
}

/**
 * Soft-deactivate related listings so deleted businesses don't leave live orphans
 * in the public directory. Docs are kept for audit; status flipped inactive.
 */
async function deactivateRelatedListings(db: Firestore, businessId: string) {
  const collections = ['offers', 'jobs', 'businessOffers', 'businessOpportunities'] as const
  let touched = 0

  for (const col of collections) {
    const snap = await db.collection(col).where('businessId', '==', businessId).get()
    if (snap.empty) continue
    const batch = db.batch()
    snap.docs.forEach((d) => {
      batch.set(
        d.ref,
        sanitizeForFirestore({
          status: col === 'jobs' || col === 'businessOpportunities' ? 'closed' : 'archived',
          isActive: false,
          updatedAt: new Date(),
          deactivatedReason: 'business_deleted',
        }),
        { merge: true }
      )
      touched += 1
    })
    await batch.commit()
  }

  return touched
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const search = request.nextUrl.searchParams.get('search')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '500', 10)

    const db = getAdminDb()
    const snapshot = await db.collection('businesses').limit(limit).get()

    let businesses = snapshot.docs.map((d) => mapBusinessDoc(d.id, d.data() as Record<string, unknown>))

    businesses.sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0
      const bTime = b.createdAt ? b.createdAt.getTime() : 0
      return bTime - aTime
    })

    if (status === 'pending') {
      businesses = businesses.filter((b) => !b.isApproved)
    } else if (status === 'approved') {
      businesses = businesses.filter((b) => b.isApproved && b.isActive)
    } else if (status === 'suspended') {
      businesses = businesses.filter((b) => !b.isActive)
    } else if (status === 'featured') {
      businesses = businesses.filter((b) => b.featured)
    }

    if (search) {
      const q = search.toLowerCase()
      businesses = businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.ownerName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({ success: true, data: businesses })
  } catch (error) {
    console.error('[v0] Businesses fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch businesses' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing business ID' }, { status: 400 })
    }

    const db = getAdminDb()
    const payload = sanitizeForFirestore({
      ...updateData,
      updatedAt: new Date(),
    })

    await db.collection('businesses').doc(id).set(payload, { merge: true })
    const updated = await db.collection('businesses').doc(id).get()

    return NextResponse.json({
      success: true,
      message: 'Business updated',
      data: updated.exists ? mapBusinessDoc(updated.id, updated.data() as Record<string, unknown>) : null,
    })
  } catch (error) {
    console.error('[v0] Business update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update business' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body as { id?: string; action?: BusinessAction }

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'id and action are required' }, { status: 400 })
    }

    const db = getAdminDb()
    const ref = db.collection('businesses').doc(id)
    const snap = await ref.get()

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const now = new Date()

    if (action === 'delete') {
      const related = await deactivateRelatedListings(db, id)
      await ref.delete()
      return NextResponse.json({
        success: true,
        message: `Business deleted. Soft-deactivated ${related} related offer/job doc(s).`,
        relatedDeactivated: related,
      })
    }

    let patch: Record<string, unknown> = { updatedAt: now }

    switch (action) {
      case 'approve':
        patch = {
          isApproved: true,
          isActive: true,
          status: 'approved',
          approvedAt: now,
          updatedAt: now,
        }
        break
      case 'verify':
        patch = {
          isVerified: true,
          verifiedAt: now,
          updatedAt: now,
        }
        break
      case 'suspend':
        patch = {
          isActive: false,
          status: 'suspended',
          suspendedAt: now,
          updatedAt: now,
        }
        break
      case 'feature':
        patch = {
          featured: true,
          featuredAt: now,
          updatedAt: now,
        }
        break
      case 'unfeature':
        patch = {
          featured: false,
          updatedAt: now,
        }
        break
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    await ref.set(sanitizeForFirestore(patch), { merge: true })
    const updated = await ref.get()

    return NextResponse.json({
      success: true,
      message: `Business ${action}d`,
      data: mapBusinessDoc(updated.id, updated.data() as Record<string, unknown>),
    })
  } catch (error) {
    console.error('[v0] Business action error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update business' }, { status: 500 })
  }
}
