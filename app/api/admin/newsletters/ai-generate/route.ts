import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { resolveAnthropicApiKey } from '@/lib/resolve-anthropic-key'
import { loadNewsletterBrandContext } from '@/lib/newsletter-templates'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { auditAdminApiAction } from '@/lib/audit-api-helper'

const FIELD_PROMPTS: Record<string, string> = {
  subject: 'Write a compelling email subject line (max 70 characters). Return only the subject line, no quotes.',
  content:
    'Write the main body of a community newsletter email. Use warm, professional tone. 2-4 short paragraphs. Plain text with paragraph breaks; no HTML.',
  subtitle: 'Write a short email subtitle or preview line (max 120 characters). Return only the subtitle.',
  seoTitle: 'Write an SEO-friendly title for this newsletter topic (max 60 characters). Return only the title.',
  metaDescription:
    'Write a meta description for this newsletter (max 155 characters). Return only the description.',
  ctaText: 'Write short call-to-action button text (2-5 words). Return only the button label.',
}

export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdminFromRequest(request)
    if (!adminUid) return unauthorizedResponse()

    const body = await request.json()
    const { field, prompt, context } = body as {
      field?: string
      prompt?: string
      context?: Record<string, string>
    }

    if (!field || !FIELD_PROMPTS[field]) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const apiKey = await resolveAnthropicApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Add it in Admin → Integrations.' },
        { status: 500 }
      )
    }

    const { settings } = await loadNewsletterBrandContext()
    const contextLines = context
      ? Object.entries(context)
          .filter(([, v]) => v?.trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      : ''

    const system = `You are a copywriter for ${settings.platformName}, a UAE-based community platform for events, volunteering, charity, and community support.
Tone: warm, professional, inclusive, and mission-driven — never salesy or corporate jargon.
Audience: members, volunteers, businesses, and sponsors across the UAE.
${settings.siteDescription ? `Mission: ${settings.siteDescription}` : ''}
Follow the same helpful, friendly voice as the platform's support chatbot.
Return only the requested copy with no preamble, labels, or markdown fences.`

    const userMessage = `${FIELD_PROMPTS[field]}

Admin brief: ${prompt.trim()}
${contextLines ? `\nExisting form context:\n${contextLines}` : ''}`

    const client = new Anthropic({ apiKey })
    const result = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: field === 'content' ? 800 : 200,
      system,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = result.content.find((b) => b.type === 'text')
    const suggestion = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : ''

    await auditAdminApiAction(request, adminUid, {
      actionType: 'update',
      action: `AI-generated newsletter ${field}`,
      entityType: 'content',
      status: 'success',
    })

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('[v0] Newsletter AI generate error:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
