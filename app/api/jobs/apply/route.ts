import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { hasBusinessAccessServer } from '@/lib/roles-server'
import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'

/**
 * Member job application — admin write so counters on jobs/businessOpportunities
 * can update without client permission errors.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = (userSnap.data() || {}) as Record<string, unknown>
    if (hasBusinessAccessServer(userData as { role?: string; roles?: string[] })) {
      return NextResponse.json(
        { success: false, error: 'Business accounts cannot apply to jobs' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const opportunityId = String(body.opportunityId || '').trim()
    if (!opportunityId) {
      return NextResponse.json({ success: false, error: 'opportunityId required' }, { status: 400 })
    }

    const jobSnap = await db.collection('jobs').doc(opportunityId).get()
    const legacySnap = jobSnap.exists
      ? null
      : await db.collection('businessOpportunities').doc(opportunityId).get()

    const listing = jobSnap.exists
      ? (jobSnap.data() as Record<string, unknown>)
      : legacySnap?.exists
        ? (legacySnap.data() as Record<string, unknown>)
        : null

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 })
    }

    const status = String(listing.status || '')
    if (!['open', 'published', 'active'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'This opportunity is not accepting applications' },
        { status: 400 }
      )
    }

    const existing = await db
      .collection('jobApplications')
      .where('opportunityId', '==', opportunityId)
      .where('applicantId', '==', uid)
      .limit(1)
      .get()

    if (!existing.empty) {
      return NextResponse.json(
        { success: false, error: 'You have already applied to this opportunity' },
        { status: 400 }
      )
    }

    const applicantName =
      String(body.applicantName || '').trim() ||
      `${String(userData.firstName || '')} ${String(userData.lastName || '')}`.trim() ||
      String(userData.email || 'Applicant')

    const now = Timestamp.now()
    const ref = db.collection('jobApplications').doc()
    const application = sanitizeForFirestore({
      id: ref.id,
      opportunityId,
      opportunityTitle: String(listing.title || body.opportunityTitle || 'Opportunity'),
      businessId: String(listing.businessId || ''),
      businessName: String(listing.businessName || listing.companyName || ''),
      applicantId: uid,
      applicantName,
      applicantEmail: String(body.applicantEmail || userData.email || ''),
      applicantPhone: String(body.applicantPhone || userData.phone || ''),
      applicantAvatarUrl: String(body.applicantAvatarUrl || userData.avatarUrl || ''),
      applicantTitle: String(body.applicantTitle || ''),
      applicantLocation: String(body.applicantLocation || ''),
      applicantEducation: String(body.applicantEducation || ''),
      applicantExperience: String(body.applicantExperience || ''),
      applicantVolunteerHours:
        typeof body.applicantVolunteerHours === 'number' ? body.applicantVolunteerHours : null,
      applicantSkills: Array.isArray(body.applicantSkills)
        ? body.applicantSkills.map((s: unknown) => String(s)).filter(Boolean)
        : [],
      coverLetter: String(body.coverLetter || ''),
      resumeUrl: String(body.resumeUrl || ''),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    await ref.set(application)

    await db
      .collection('jobs')
      .doc(opportunityId)
      .collection('applications')
      .doc(ref.id)
      .set(
        {
          ...application,
          jobId: opportunityId,
        },
        { merge: true }
      )

    const applicantsRaw = Array.isArray(listing.applicants) ? listing.applicants : []
    const applicants = applicantsRaw.map((a: unknown) => String(a)).filter(Boolean)
    if (!applicants.includes(uid)) applicants.push(uid)

    if (jobSnap.exists) {
      await jobSnap.ref.set(
        {
          applicants,
          applications: applicants.length,
          applicationCount: applicants.length,
          updatedAt: now,
        },
        { merge: true }
      )
    }

    const legacyRef = db.collection('businessOpportunities').doc(opportunityId)
    const legacyExists = legacySnap?.exists || (await legacyRef.get()).exists
    if (legacyExists) {
      await legacyRef.set(
        {
          applicants,
          applications: applicants.length,
          updatedAt: now,
        },
        { merge: true }
      )
    }

    const businessId = String(listing.businessId || '')
    const jobTitle = String(listing.title || 'Opportunity')
    const site = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.passive-blessings.com'
    ).replace(/\/$/, '')

    if (businessId) {
      sendBrandedEmailToUserSafe({
        userId: businessId,
        subject: `New application: ${jobTitle}`,
        purpose: 'New job application notification',
        headline: 'New job application',
        bodyHtml: paragraphs(
          'Assalamu alaikum,',
          `${applicantName} applied to “${jobTitle}”.`,
          'Review the application in your business opportunities dashboard.'
        ),
        cta: { label: 'View applications', url: `${site}/business/opportunities` },
      })
    }

    sendBrandedEmailToUserSafe({
      userId: uid,
      subject: `Application submitted: ${jobTitle}`,
      purpose: 'Job application confirmation',
      headline: 'Application submitted',
      bodyHtml: paragraphs(
        'Assalamu alaikum,',
        `Your application for “${jobTitle}” was submitted successfully.`,
        'We will notify you when the business responds.'
      ),
      cta: { label: 'View my applications', url: `${site}/dashboard/opportunities` },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      },
    })
  } catch (error) {
    console.error('[api/jobs/apply]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
