import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import { fetchNewsletterRecipients } from '@/lib/newsletter-recipients'
import { loadNewsletterBrandContext, type NewsletterTemplateId } from '@/lib/newsletter-templates'
import { sendNewsletterBulk } from '@/lib/sendgrid-newsletter'

export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdminFromRequest(request)
    if (!adminUid) return unauthorizedResponse()

    const body = await request.json()
    const {
      subject,
      content,
      template = 'classic',
      sendOption = 'now',
      scheduleDate,
      subtitle,
      seoTitle,
      metaDescription,
      ctaText,
      ctaUrl,
      newsletterId,
    } = body as {
      subject?: string
      content?: string
      template?: NewsletterTemplateId
      sendOption?: 'now' | 'schedule'
      scheduleDate?: string
      subtitle?: string
      seoTitle?: string
      metaDescription?: string
      ctaText?: string
      ctaUrl?: string
      newsletterId?: string
    }

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }

    const validTemplate = (['classic', 'modern', 'minimal', 'highlight'].includes(template)
      ? template
      : 'classic') as NewsletterTemplateId

    const db = getAdminDb()
    const now = new Date()
    const scheduledFor =
      sendOption === 'schedule' && scheduleDate ? new Date(scheduleDate) : null

    const baseDoc = sanitizeForFirestore({
      title: subject.trim(),
      subject: subject.trim(),
      content: content.trim(),
      template: validTemplate,
      subtitle: subtitle?.trim() || null,
      seoTitle: seoTitle?.trim() || null,
      metaDescription: metaDescription?.trim() || null,
      ctaText: ctaText?.trim() || null,
      ctaUrl: ctaUrl?.trim() || null,
      createdBy: adminUid,
      updatedAt: now,
      openedCount: 0,
      clickedCount: 0,
    })

    let docId = newsletterId
    if (!docId) {
      const ref = await db.collection('newsletters').add(
        sanitizeForFirestore({
          ...baseDoc,
          status: sendOption === 'schedule' ? 'scheduled' : 'draft',
          scheduledFor: scheduledFor || null,
          recipientCount: 0,
          sendStatus: sendOption === 'schedule' ? 'pending' : 'pending',
          createdAt: now,
        })
      )
      docId = ref.id
    } else {
      await db.collection('newsletters').doc(docId).set(
        sanitizeForFirestore({
          ...baseDoc,
          status: sendOption === 'schedule' ? 'scheduled' : 'draft',
          scheduledFor: scheduledFor || null,
        }),
        { merge: true }
      )
    }

    if (sendOption === 'schedule') {
      await auditAdminApiAction(request, adminUid, {
        actionType: 'create',
        action: `Scheduled newsletter: ${subject}`,
        entityType: 'content',
        entityId: docId,
        entityName: subject,
        status: 'success',
      })
      return NextResponse.json({
        success: true,
        newsletterId: docId,
        status: 'scheduled',
        message: 'Newsletter scheduled successfully.',
      })
    }

    const recipients = await fetchNewsletterRecipients()
    const { settings, logoUrl } = await loadNewsletterBrandContext()

    await db.collection('newsletters').doc(docId).set(
      sanitizeForFirestore({
        status: 'draft',
        sendStatus: 'pending',
        recipientCount: recipients.length,
      }),
      { merge: true }
    )

    const sendResult = await sendNewsletterBulk({
      subject: subject.trim(),
      content: content.trim(),
      template: validTemplate,
      subtitle: subtitle?.trim(),
      ctaText: ctaText?.trim(),
      ctaUrl: ctaUrl?.trim(),
      recipients,
      settings,
      logoUrl,
    })

    const finalStatus = sendResult.status === 'sent' ? 'sent' : sendResult.status === 'partial' ? 'sent' : 'draft'
    const sendStatus = sendResult.status

    await db.collection('newsletters').doc(docId).set(
      sanitizeForFirestore({
        status: finalStatus,
        sendStatus,
        sentAt: sendResult.sentCount > 0 ? now : null,
        recipientCount: sendResult.sentCount,
        totalTargeted: sendResult.totalRecipients,
        failedCount: sendResult.failedCount,
        sendErrors: sendResult.errors.length > 0 ? sendResult.errors.join('; ') : null,
        updatedAt: now,
      }),
      { merge: true }
    )

    await auditAdminApiAction(request, adminUid, {
      actionType: 'create',
      action: `Sent newsletter: ${subject} (${sendResult.sentCount}/${sendResult.totalRecipients})`,
      entityType: 'content',
      entityId: docId,
      entityName: subject,
      status: sendResult.success ? 'success' : 'failure',
    })

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          newsletterId: docId,
          error: sendResult.errors[0] || 'Failed to send newsletter',
          sendResult,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      newsletterId: docId,
      status: sendStatus,
      message: `Newsletter sent to ${sendResult.sentCount} recipients`,
      sendResult,
    })
  } catch (error) {
    console.error('[v0] Newsletter send error:', error)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}
