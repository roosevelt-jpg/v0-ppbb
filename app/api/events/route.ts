import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'
import { notifyNewEventPublished } from '@/lib/push-notifications-server'
import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'

function sortEventsByCreatedAt(events: Array<Record<string, unknown> & { id: string }>) {
  return events.sort((a, b) => {
    const aTime = new Date((a.createdAt as string) || 0).getTime()
    const bTime = new Date((b.createdAt as string) || 0).getTime()
    return bTime - aTime
  })
}

async function notifyEventCreator(
  createdBy: string,
  title: string,
  type: 'event_approved' | 'event_rejected' | 'event_changes_requested',
  message: string
) {
  if (!createdBy || createdBy === 'admin') return
  try {
    const db = getAdminDb()
    await db.collection('users').doc(createdBy).collection('notifications').add({
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
    })

    const purposeMap = {
      event_approved: 'Event approval notification',
      event_rejected: 'Event rejection notification',
      event_changes_requested: 'Event changes requested',
    } as const
    const headlineMap = {
      event_approved: 'Event approved',
      event_rejected: 'Event not approved',
      event_changes_requested: 'Changes requested',
    } as const
    const site = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.passive-blessings.com'
    ).replace(/\/$/, '')
    sendBrandedEmailToUserSafe({
      userId: createdBy,
      subject: `${headlineMap[type]}: ${title}`,
      purpose: purposeMap[type],
      headline: headlineMap[type],
      bodyHtml: paragraphs('Assalamu alaikum,', message),
      cta: { label: 'View my events', url: `${site}/dashboard/events` },
    })
  } catch (error) {
    console.warn('[v0] Could not notify event creator:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const createdBy = request.nextUrl.searchParams.get('createdBy')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10)
    const id = request.nextUrl.searchParams.get('id')

    const db = getAdminDb()

    if (id) {
      const snap = await db.collection('events').doc(id).get()
      if (!snap.exists) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: serializeFirestoreDoc(snap.id, snap.data() as Record<string, unknown>),
      })
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('events')

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }
    if (createdBy) {
      query = query.where('createdBy', '==', createdBy)
    }

    const snapshot = await query.limit(limit).get()
    const events = sortEventsByCreatedAt(
      snapshot.docs.map((doc) =>
        serializeFirestoreDoc(doc.id, doc.data() as Record<string, unknown>) as Record<string, unknown> & { id: string }
      )
    )

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error('[v0] Events fetch error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch events'
    if (message.includes('index')) {
      console.error(
        '[v0] Firestore composite index may be required. Create it in Firebase Console → Firestore → Indexes:',
        message
      )
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = getAdminDb()
    const { verifyIdToken } = await import('@/lib/admin-access-server')
    const { hasBusinessAccessServer, hasAdminAccessServer } = await import('@/lib/roles-server')

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization required to create events' },
        { status: 401 }
      )
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userSnap = await db.collection('users').doc(uid).get()
    const userData = (userSnap.data() as Record<string, unknown>) || {}
    const userRoleData = (userData as { role?: string; roles?: string[] }) || null

    if (!hasAdminAccessServer(userRoleData) && !hasBusinessAccessServer(userRoleData)) {
      return NextResponse.json(
        { success: false, error: 'Members cannot create events' },
        { status: 403 }
      )
    }

    const createdByRole = hasAdminAccessServer(userRoleData) ? 'admin' : 'business'
    const { resolveEventHostFromUserData } = await import('@/lib/event-host')
    const host = resolveEventHostFromUserData(uid, userData, createdByRole)

    const locationName = body.locationName || body.location
    const startDate = body.startDate || body.date
    if (!body.title || !startDate || !locationName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, startDate, or locationName' },
        { status: 400 }
      )
    }

    let status = body.status || 'draft'
    const isBusiness = createdByRole === 'business'

    if (isBusiness) {
      if (status === 'published') {
        status = 'pending_approval'
      }
      if (status === 'submitted') {
        status = 'pending_approval'
      }
    }

    const isPublished = status === 'published'
    const isPending = status === 'pending_approval'

    const pricingType = body.pricingType || (body.isPaid ? 'paid_by_pb' : 'free')
    const isBusinessPaid =
      isBusiness &&
      (pricingType === 'paid_by_business' ||
        (body.isPaid === true && pricingType !== 'free' && pricingType !== 'member_only'))

    if (isBusinessPaid) {
      const { normalizeHostPaymentCollection } = await import('@/lib/pb-payment-policy')
      const collection = normalizeHostPaymentCollection(
        body.hostPaymentCollection || body.paymentCollection
      )
      const link = String(body.hostPaymentLink || body.paymentLink || '').trim()
      const wa = String(body.hostWhatsapp || body.whatsapp || '').trim()
      if (collection === 'payment_link' && !link) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Add your payment link so attendees can pay you directly. Passive Blessings does not collect ticket money for business events.',
          },
          { status: 400 }
        )
      }
      if (collection === 'whatsapp' && !wa) {
        return NextResponse.json(
          {
            success: false,
            error: 'Add a WhatsApp number so buyers can request payment details from you.',
          },
          { status: 400 }
        )
      }
    }

    // Load posting fee for business paid events
    let postingFeeAmount = 0
    let postingFeeStatus: 'not_required' | 'pending' | 'paid' | 'waived' = 'not_required'
    if (isBusinessPaid) {
      try {
        const cfgSnap = await db.collection('platformConfig').doc('events').get()
        const fee = Number(cfgSnap.data()?.businessPaidEventPostingFee)
        if (Number.isFinite(fee) && fee > 0) {
          postingFeeAmount = fee
          postingFeeStatus = 'pending'
        }
      } catch {
        /* keep not_required */
      }
    }

    let cohostIds: string[] = Array.isArray(body.cohostIds) ? body.cohostIds : []
    if (Array.isArray(body.cohostEmails) && body.cohostEmails.length) {
      const { resolveCohostIds } = await import('@/lib/event-luma-server')
      const resolved = await resolveCohostIds(body.cohostEmails)
      cohostIds = Array.from(new Set([...cohostIds, ...resolved]))
    }

    const eventData = sanitizeForFirestore({
      title: body.title,
      description: body.description || '',
      category: body.category || 'general',
      tags: body.tags || [],
      genderRestriction: body.genderRestriction || 'mixed',
      isFeatured: body.isFeatured || false,

      speakers: body.speakers || [],
      agenda: body.agenda || [],

      locationName: body.locationName || body.location || '',
      locationAddress: body.locationAddress || body.locationName || body.location || '',
      locationPlaceId: body.locationPlaceId || body.locationData?.placeId || '',
      locationLat: body.locationLat ?? body.locationData?.lat ?? 0,
      locationLng: body.locationLng ?? body.locationData?.lng ?? 0,

      startDate: new Date(body.startDate || body.date),
      endDate: new Date(body.endDate || body.startDate || body.date),
      timezone: body.timezone || 'Asia/Dubai',

      pricingType: body.pricingType || (body.isPaid ? 'paid_by_pb' : 'free'),
      price: body.price ?? null,
      currency: body.currency || 'AED',
      revenueModel:
        body.revenueModel ||
        (createdByRole === 'business' && body.pricingType === 'paid_by_business'
          ? null
          : body.isPaid
            ? 'pb_full'
            : null),
      pbCommissionPercent: body.pbCommissionPercent || null,
      businessPayoutPercent: body.businessPayoutPercent || null,
      pbCommissionOverride: body.pbCommissionOverride || false,
      paymentGateway:
        createdByRole === 'business' &&
        (body.pricingType === 'paid_by_business' || (body.isPaid && createdByRole === 'business'))
          ? 'host_direct'
          : body.paymentGateway || null,
      hostPaymentCollection:
        createdByRole === 'business'
          ? body.hostPaymentCollection || body.paymentCollection || 'payment_link'
          : null,
      hostPaymentLink:
        typeof body.hostPaymentLink === 'string'
          ? body.hostPaymentLink.trim()
          : typeof body.paymentLink === 'string'
            ? body.paymentLink.trim()
            : null,
      hostWhatsapp:
        typeof body.hostWhatsapp === 'string'
          ? body.hostWhatsapp.trim()
          : typeof body.whatsapp === 'string'
            ? body.whatsapp.trim()
            : null,
      postingFeeAmount: postingFeeAmount || null,
      postingFeeStatus,
      postingFeePaymentIntentId: null,

      ticketTypes: Array.isArray(body.ticketTypes)
        ? body.ticketTypes.map((t: Record<string, unknown>) => ({
            ...t,
            requireApproval: false,
          }))
        : [],
      coupons: body.coupons || [],
      requireApproval: Boolean(body.requireApproval),
      enableWaitlist: body.enableWaitlist !== false,
      allowNonMemberGuests: body.allowNonMemberGuests === true,
      waitlistCount: 0,
      cohostIds,
      cohostEmails: body.cohostEmails || [],
      showGuestList: body.showGuestList !== false,
      recurrence: body.recurrence || null,
      seriesId: body.seriesId || null,

      bannerURL: body.bannerURL || body.bannerImageUrl || body.bannerImage || '',
      bannerImage: body.bannerURL || body.bannerImageUrl || body.bannerImage || '',
      bannerImageUrl: body.bannerURL || body.bannerImageUrl || body.bannerImage || '',
      maxAttendees: (() => {
        const explicit = Number(body.maxAttendees)
        if (Number.isFinite(explicit) && explicit > 0) return explicit
        const tickets = Array.isArray(body.ticketTypes) ? body.ticketTypes : []
        const caps = tickets
          .map((t: { capacity?: unknown }) => Number(t?.capacity))
          .filter((n: number) => Number.isFinite(n) && n > 0)
        return caps.length ? caps.reduce((a: number, b: number) => a + b, 0) : null
      })(),
      currentAttendees: 0,

      totalRevenue: 0,
      pbRevenue: 0,
      businessRevenue: 0,
      payoutStatus: 'not_applicable',
      payoutReference: null,
      payoutDate: null,

      status,
      publishedAt: isPublished ? Timestamp.now() : null,
      cancelledAt: null,
      cancelReason: null,

      createdBy: uid,
      createdByRole,
      businessId: host.businessId,
      businessName: createdByRole === 'admin' ? 'Admin' : host.businessName,
      ownerName: createdByRole === 'admin' ? 'Admin' : host.ownerName,
      businessLogoUrl: createdByRole === 'admin' ? '' : host.businessLogoUrl,
      // Admin publishes skip pending — still record when the event entered the system
      submittedAt: isPending || isPublished ? Timestamp.now() : null,
      approvedBy: isPublished && !isBusiness ? uid : null,
      approvedAt: isPublished && !isBusiness ? Timestamp.now() : null,
      approvalNotes: null,
      lastEditedBy: null,
      lastEditedAt: null,
      editHistory: [],

      calendarEventId: null,

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    const docRef = await db.collection('events').add(eventData)

    if (isPublished && body.recurrence?.frequency) {
      const { generateRecurringEvents } = await import('@/lib/event-luma-server')
      void generateRecurringEvents(docRef.id, { ...eventData, id: docRef.id }, body.recurrence).catch(
        console.error
      )
    }

    if (isPublished) {
      void notifyNewEventPublished(String(body.title || 'New event'), docRef.id).catch(console.error)
    }

    // Business paid-event posting fee via PB Stripe
    if (postingFeeStatus === 'pending' && postingFeeAmount > 0) {
      try {
        const { resolveStripeConfig } = await import('@/lib/resolve-stripe-key')
        const { createEmbeddedPaymentIntent } = await import('@/lib/stripe-embedded')
        const stripeConfig = await resolveStripeConfig()
        if (stripeConfig?.secretKey && stripeConfig.publishableKey) {
          const embedded = await createEmbeddedPaymentIntent({
            amountMinor: Math.round(postingFeeAmount * 100),
            currency: 'aed',
            description: `Event posting fee — ${String(body.title || 'Event')}`,
            metadata: {
              type: 'event_posting',
              eventId: docRef.id,
              userId: uid,
              amount: String(postingFeeAmount),
            },
          })
          await docRef.update({ postingFeePaymentIntentId: embedded.paymentIntentId })
          return NextResponse.json({
            success: true,
            data: { id: docRef.id, ...eventData, postingFeePaymentIntentId: embedded.paymentIntentId },
            postingFee: {
              required: true,
              amount: postingFeeAmount,
              currency: 'AED',
              clientSecret: embedded.clientSecret,
              publishableKey: embedded.publishableKey,
              paymentIntentId: embedded.paymentIntentId,
            },
          })
        }
      } catch (err) {
        console.error('[events] posting fee intent failed:', err)
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...eventData },
    })
  } catch (error) {
    console.error('[v0] Event creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create event'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rawUpdates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Event ID required' }, { status: 400 })
    }

    const db = getAdminDb()
    const existingSnap = await db.collection('events').doc(id).get()
    if (!existingSnap.exists) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }
    const existing = existingSnap.data()!

    // Never overwrite immutable create metadata via update
    const {
      createdAt: _createdAt,
      createdBy: _createdBy,
      createdByRole: _createdByRole,
      id: _ignoredId,
      ...safeUpdates
    } = rawUpdates as Record<string, unknown>

    const updates: Record<string, unknown> = { ...safeUpdates }

    if (updates.startDate && typeof updates.startDate === 'string') {
      updates.startDate = new Date(updates.startDate)
    }
    if (updates.endDate && typeof updates.endDate === 'string') {
      updates.endDate = new Date(updates.endDate)
    }

    if (updates.status === 'published' && !updates.pbCommissionPercent) {
      try {
        const configDoc = await db.collection('platformConfig').doc('events').get()
        if (configDoc.exists) {
          const config = configDoc.data()
          updates.pbCommissionPercent = config?.pbCommissionPercent || 10
          updates.businessPayoutPercent = 100 - (updates.pbCommissionPercent as number || 10)
        }
      } catch {
        updates.pbCommissionPercent = 10
        updates.businessPayoutPercent = 90
      }
      updates.publishedAt = Timestamp.now()
    }

    if (updates.status === 'pending_approval' && !updates.submittedAt) {
      updates.submittedAt = Timestamp.now()
    }

    if (updates.status === 'published' && !existing.submittedAt && !updates.submittedAt) {
      updates.submittedAt = existing.publishedAt || Timestamp.now()
    }

    if (updates.status === 'published' && !updates.publishedAt) {
      updates.publishedAt = Timestamp.now()
      updates.approvedAt = Timestamp.now()
    }

    if (Array.isArray(updates.ticketTypes)) {
      updates.ticketTypes = (updates.ticketTypes as Record<string, unknown>[]).map((t) => ({
        ...t,
        requireApproval: false,
      }))
      if (updates.maxAttendees == null || updates.maxAttendees === '' || Number(updates.maxAttendees) <= 0) {
        const caps = (updates.ticketTypes as { capacity?: unknown }[])
          .map((t) => Number(t.capacity))
          .filter((n) => Number.isFinite(n) && n > 0)
        if (caps.length) {
          updates.maxAttendees = caps.reduce((a, b) => a + b, 0)
        }
      }
    }

    if (updates.maxAttendees === '' || updates.maxAttendees === 0) {
      updates.maxAttendees = null
    }

    if (typeof updates.bannerURL === 'string') {
      updates.bannerImage = updates.bannerURL
      updates.bannerImageUrl = updates.bannerURL
    }

    // Optionally push shared fields to future events in the same series (explicit consent)
    const applyFuture =
      body.applyChangesToFuture === true ||
      (updates.recurrence &&
        typeof updates.recurrence === 'object' &&
        (updates.recurrence as { applyChangesToFuture?: boolean }).applyChangesToFuture === true)
    const seriesId = (existing.seriesId as string) || (updates.seriesId as string) || null

    // Do not persist one-shot consent flags on the event document
    delete updates.applyChangesToFuture
    if (updates.recurrence && typeof updates.recurrence === 'object') {
      const { applyChangesToFuture: _acf, ...recRest } = updates.recurrence as Record<string, unknown>
      updates.recurrence = Object.keys(recRest).length ? recRest : updates.recurrence
      if ('applyChangesToFuture' in (updates.recurrence as object)) {
        delete (updates.recurrence as { applyChangesToFuture?: boolean }).applyChangesToFuture
      }
    }

    updates.updatedAt = Timestamp.now()
    if (updates.lastEditedAt) {
      updates.lastEditedAt = Timestamp.now()
    }

    const sanitized = sanitizeForFirestore(updates)
    await db.collection('events').doc(id).update(sanitized)

    if (applyFuture && seriesId) {
      const nowStart = updates.startDate
        ? new Date(updates.startDate as string | Date)
        : existing.startDate?.toDate
          ? existing.startDate.toDate()
          : new Date()
      const shared: Record<string, unknown> = {}
      for (const key of [
        'title',
        'description',
        'bannerURL',
        'bannerImage',
        'bannerImageUrl',
        'galleryURLs',
        'locationName',
        'locationAddress',
        'locationPlaceId',
        'locationLat',
        'locationLng',
        'category',
        'genderRestriction',
        'tags',
        'speakers',
        'agenda',
        'startTime',
        'endTime',
        'timezone',
        'hostName',
        'requireApproval',
        'enableWaitlist',
        'allowNonMemberGuests',
        'showGuestList',
        'pricingType',
        'price',
        'currency',
        'ticketTypes',
        'maxAttendees',
      ] as const) {
        if (key in sanitized) shared[key] = sanitized[key]
      }
      if (Object.keys(shared).length) {
        shared.updatedAt = Timestamp.now()
        const siblings = await db
          .collection('events')
          .where('seriesId', '==', seriesId)
          .get()
        const batch = db.batch()
        siblings.docs.forEach((docSnap) => {
          if (docSnap.id === id) return
          const start = docSnap.data().startDate?.toDate?.() || new Date(docSnap.data().startDate)
          if (start >= nowStart) {
            batch.update(docSnap.ref, shared)
          }
        })
        await batch.commit()
      }
    }

    const title = (existing.title as string) || 'Your event'
    const createdBy = (existing.createdBy as string) || ''

    if (updates.status === 'published' && existing.status !== 'published') {
      void notifyNewEventPublished(title, id).catch(console.error)
      if (updates.recurrence || existing.recurrence) {
        const { generateRecurringEvents } = await import('@/lib/event-luma-server')
        const recurrence = (updates.recurrence || existing.recurrence) as any
        if (recurrence?.frequency) {
          void generateRecurringEvents(id, { ...existing, ...updates, id }, recurrence).catch(
            console.error
          )
        }
      }
    }

    if (updates.status === 'published' && existing.status === 'pending_approval') {
      await notifyEventCreator(
        createdBy,
        title,
        'event_approved',
        `Your event "${title}" has been approved and published.`
      )
    }
    if (updates.status === 'rejected') {
      await notifyEventCreator(
        createdBy,
        title,
        'event_rejected',
        updates.approvalNotes
          ? `Your event "${title}" was rejected: ${updates.approvalNotes}`
          : `Your event "${title}" was rejected.`
      )
    }
    if (updates.status === 'changes_requested') {
      await notifyEventCreator(
        createdBy,
        title,
        'event_changes_requested',
        updates.approvalNotes
          ? `Changes requested for "${title}": ${updates.approvalNotes}`
          : `Changes were requested for your event "${title}".`
      )
    }

    return NextResponse.json({ success: true, message: 'Event updated', data: { id, ...sanitized } })
  } catch (error) {
    console.error('[v0] Event update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Event ID required' }, { status: 400 })
    }

    const db = getAdminDb()
    await db.collection('events').doc(id).delete()

    return NextResponse.json({ success: true, message: 'Event deleted' })
  } catch (error) {
    console.error('[v0] Event delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 })
  }
}
