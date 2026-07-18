import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { getApps } from 'firebase-admin/app'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'
import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  const ok = await isAdminUser(uid)
  return ok ? uid : null
}

async function notifyBusinessListingLive(businessId: string, title: string, jobId: string) {
  if (!businessId) return
  const db = getAdminDb()
  const message = `Your listing ${title} is now live.`

  try {
    await db.collection('users').doc(businessId).collection('notifications').add(
      sanitizeForFirestore({
        type: 'job_approved',
        title: 'Listing published',
        message,
        jobId,
        read: false,
        createdAt: Timestamp.now(),
      })
    )
  } catch (err) {
    console.warn('[admin/opportunities] in-app notify failed:', err)
  }

  const site = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
  sendBrandedEmailToUserSafe({
    userId: businessId,
    subject: 'Your opportunity listing is live',
    purpose: 'Job / opportunity approval',
    headline: 'Listing published',
    bodyHtml: paragraphs('Assalamu alaikum,', message),
    cta: { label: 'View opportunities', url: `${site}/business/opportunities` },
  })

  try {
    const userSnap = await db.collection('users').doc(businessId).get()
    const userData = userSnap.data() || {}
    const fcmToken = userData.fcmToken
    if (typeof fcmToken !== 'string' || fcmToken.length < 10) return

    const { shouldNotifyUser } = await import('@/lib/user-settings')
    if (!shouldNotifyUser({ ...userData, id: businessId }, 'push', 'systemAlerts')) return

    const fcmSettings = userData.fcmSettings || {}
    if (fcmSettings.enabled === false) return

    const app = getApps()[0]
    if (!app) return
    const messaging = getMessaging(app)
    await messaging.send({
      token: fcmToken,
      notification: {
        title: 'Listing published',
        body: message,
      },
      data: {
        type: 'job_approved',
        jobId,
        click_action: '/business/opportunities',
      },
    })
  } catch (err) {
    console.warn('[admin/opportunities] FCM notify failed:', err)
  }
}

/**
 * Dual-write status/flag updates to jobs + businessOpportunities (same id).
 * Does not change business posting flows — admin monitoring only.
 */
async function syncJobAndOpportunity(
  jobId: string,
  updates: Record<string, unknown>
) {
  const db = getAdminDb()
  const payload = sanitizeForFirestore({
    ...updates,
    updatedAt: Timestamp.now(),
  })

  const jobsRef = db.collection('jobs').doc(jobId)
  const oppRef = db.collection('businessOpportunities').doc(jobId)

  const [jobsSnap, oppSnap] = await Promise.all([jobsRef.get(), oppRef.get()])

  const writes: Promise<unknown>[] = []
  if (jobsSnap.exists) writes.push(jobsRef.update(payload))
  else if (Object.keys(updates).length) {
    // Rare: legacy only in businessOpportunities — still create thin jobs mirror on approve/close
    if (oppSnap.exists) {
      const opp = oppSnap.data() || {}
      writes.push(
        jobsRef.set(
          sanitizeForFirestore({
            id: jobId,
            businessId: opp.businessId,
            businessName: opp.businessName,
            title: opp.title,
            description: opp.description || '',
            category: opp.category || opp.type || '',
            jobType: opp.type || opp.jobType || 'job',
            ...payload,
            createdAt: opp.createdAt || Timestamp.now(),
          }),
          { merge: true }
        )
      )
    }
  }

  if (oppSnap.exists) {
    // Map published → open on legacy portal so apply/browse flows keep working
    const oppPayload = { ...payload }
    if (updates.status === 'published') {
      oppPayload.status = 'open'
    }
    writes.push(oppRef.update(oppPayload))
  }

  await Promise.all(writes)
  return { jobsExists: jobsSnap.exists, oppExists: oppSnap.exists }
}

export async function GET(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    const db = getAdminDb()

    if (id) {
      const jobsSnap = await db.collection('jobs').doc(id).get()
      if (jobsSnap.exists) {
        return NextResponse.json({
          success: true,
          data: serializeFirestoreDoc(jobsSnap.id, jobsSnap.data() as Record<string, unknown>),
        })
      }
      const oppSnap = await db.collection('businessOpportunities').doc(id).get()
      if (oppSnap.exists) {
        return NextResponse.json({
          success: true,
          data: serializeFirestoreDoc(oppSnap.id, oppSnap.data() as Record<string, unknown>),
        })
      }
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const snap = await db.collection('jobs').limit(500).get()
    const data = snap.docs.map((d) =>
      serializeFirestoreDoc(d.id, d.data() as Record<string, unknown>)
    )
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[admin/opportunities] GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id : ''
    const action = typeof body.action === 'string' ? body.action : ''

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'id and action required' }, { status: 400 })
    }

    const db = getAdminDb()
    const jobsSnap = await db.collection('jobs').doc(id).get()
    const oppSnap = await db.collection('businessOpportunities').doc(id).get()
    if (!jobsSnap.exists && !oppSnap.exists) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    const current = (jobsSnap.exists ? jobsSnap.data() : oppSnap.data()) || {}
    const title = (current.title as string) || 'Your listing'
    const businessId = (current.businessId as string) || ''

    if (action === 'approve') {
      await syncJobAndOpportunity(id, {
        status: 'published',
        approvedAt: Timestamp.now(),
        approvedBy: adminUid,
        flagged: false,
      })
      await notifyBusinessListingLive(businessId, title, id)
      await auditAdminApiAction(request, adminUid, {
        actionType: 'approve',
        action: `Approved opportunity: ${title}`,
        entityType: 'event',
        entityId: id,
        entityName: title,
        status: 'success',
      })
      return NextResponse.json({ success: true, status: 'published' })
    }

    if (action === 'close') {
      await syncJobAndOpportunity(id, {
        status: 'closed',
        closedAt: Timestamp.now(),
        closedBy: adminUid,
      })
      await auditAdminApiAction(request, adminUid, {
        actionType: 'update',
        action: `Closed opportunity: ${title}`,
        entityType: 'event',
        entityId: id,
        entityName: title,
        status: 'success',
      })
      return NextResponse.json({ success: true, status: 'closed' })
    }

    if (action === 'flag') {
      const nextFlagged = !(current.flagged === true)
      await syncJobAndOpportunity(id, {
        flagged: nextFlagged,
        flaggedAt: nextFlagged ? Timestamp.now() : FieldValue.delete(),
        flaggedBy: nextFlagged ? adminUid : FieldValue.delete(),
      })
      await auditAdminApiAction(request, adminUid, {
        actionType: 'update',
        action: nextFlagged ? `Flagged opportunity: ${title}` : `Removed flag from opportunity: ${title}`,
        entityType: 'event',
        entityId: id,
        entityName: title,
        status: 'success',
      })
      return NextResponse.json({ success: true, flagged: nextFlagged })
    }

    if (action === 'update') {
      const allowed: Record<string, unknown> = {}
      if (typeof body.title === 'string') allowed.title = body.title.trim()
      if (typeof body.category === 'string') allowed.category = body.category.trim()
      if (typeof body.type === 'string' || typeof body.jobType === 'string') {
        allowed.jobType = (body.jobType || body.type || '').trim()
        allowed.type = (body.type || body.jobType || '').trim()
      }
      if (typeof body.gender === 'string') allowed.gender = body.gender.trim()
      if (typeof body.description === 'string') allowed.description = body.description
      if (typeof body.status === 'string') allowed.status = body.status
      if (body.deadline) allowed.deadline = new Date(body.deadline)

      if (Object.keys(allowed).length === 0) {
        return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
      }

      await syncJobAndOpportunity(id, allowed)
      await auditAdminApiAction(request, adminUid, {
        actionType: 'update',
        action: `Updated opportunity: ${title}`,
        entityType: 'event',
        entityId: id,
        entityName: title,
        status: 'success',
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[admin/opportunities] PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    }

    const db = getAdminDb()
    const jobsSnap = await db.collection('jobs').doc(id).get()
    const title =
      jobsSnap.exists
        ? String((jobsSnap.data() as Record<string, unknown>).title || 'Opportunity')
        : 'Opportunity'

    const batch = db.batch()
    batch.delete(db.collection('jobs').doc(id))
    batch.delete(db.collection('businessOpportunities').doc(id))
    await batch.commit()

    await auditAdminApiAction(request, adminUid, {
      actionType: 'delete',
      action: `Deleted opportunity: ${title}`,
      entityType: 'event',
      entityId: id,
      entityName: title,
      status: 'success',
    })

    return NextResponse.json({ success: true, deletedBy: adminUid })
  } catch (error) {
    console.error('[admin/opportunities] DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 })
  }
}
