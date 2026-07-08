import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { fetchNewsletterRecipients } from '@/lib/newsletter-recipients'
import { loadNewsletterBrandContext, type NewsletterTemplateId } from '@/lib/newsletter-templates'
import { sendNewsletterBulk } from '@/lib/sendgrid-newsletter'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUid = await requireAdminFromRequest(request)
    if (!adminUid) return unauthorizedResponse()

    const { id } = await params
    const db = getAdminDb()
    const snap = await db.collection('newsletters').doc(id).get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }

    const data = snap.data()!
    const recipients = await fetchNewsletterRecipients()
    const { settings, logoUrl } = await loadNewsletterBrandContext()
    const now = new Date()

    const sendResult = await sendNewsletterBulk({
      subject: String(data.subject || data.title),
      content: String(data.content || ''),
      template: (data.template || 'classic') as NewsletterTemplateId,
      subtitle: data.subtitle,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      recipients,
      settings,
      logoUrl,
    })

    await db.collection('newsletters').doc(id).set(
      sanitizeForFirestore({
        status: sendResult.sentCount > 0 ? 'sent' : 'draft',
        sendStatus: sendResult.status,
        sentAt: sendResult.sentCount > 0 ? now : null,
        recipientCount: sendResult.sentCount,
        totalTargeted: sendResult.totalRecipients,
        failedCount: sendResult.failedCount,
        sendErrors: sendResult.errors.length > 0 ? sendResult.errors.join('; ') : null,
        updatedAt: now,
      }),
      { merge: true }
    )

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.errors[0] || 'Failed to send newsletter', sendResult },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${sendResult.sentCount} recipients`,
      recipientCount: sendResult.sentCount,
      sendResult,
    })
  } catch (error) {
    console.error('[v0] Error sending newsletter:', error)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}
