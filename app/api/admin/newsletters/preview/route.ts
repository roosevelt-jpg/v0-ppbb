import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { loadNewsletterBrandContext, renderNewsletterHtml, type NewsletterTemplateId } from '@/lib/newsletter-templates'

export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdminFromRequest(request)
    if (!adminUid) return unauthorizedResponse()

    const body = await request.json()
    const {
      subject = '',
      content = '',
      template = 'classic',
      subtitle,
      ctaText,
      ctaUrl,
    } = body as {
      subject?: string
      content?: string
      template?: NewsletterTemplateId
      subtitle?: string
      ctaText?: string
      ctaUrl?: string
    }

    const { settings, logoUrl } = await loadNewsletterBrandContext()
    const html = renderNewsletterHtml({
      subject: subject || 'Newsletter Preview',
      content: content || 'Your newsletter content will appear here.',
      template: (['classic', 'modern', 'minimal', 'highlight'].includes(template) ? template : 'classic') as NewsletterTemplateId,
      subtitle,
      ctaText,
      ctaUrl,
      settings,
      logoUrl,
    })

    return NextResponse.json({ html })
  } catch (error) {
    console.error('[v0] Newsletter preview error:', error)
    return NextResponse.json({ error: 'Failed to render preview' }, { status: 500 })
  }
}
