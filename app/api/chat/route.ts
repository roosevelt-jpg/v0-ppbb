import { NextRequest, NextResponse } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'
import { getAdminDb } from '@/lib/firebase-admin'
import { resolveAnthropicApiKey } from '@/lib/resolve-anthropic-key'
import { mergeGlobalSettings } from '@/lib/global-settings'
import {
  normalizeKnowledgeDoc,
  scoreKnowledgeMatch,
  type ChatbotKnowledgeItem,
} from '@/lib/chatbot-knowledge'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  isActive?: boolean
  status?: string
  order?: number
}

function isFaqUsable(faq: FAQ): boolean {
  if (faq.status === 'published') return true
  if (faq.status === 'draft') return false
  return faq.isActive === true
}

async function searchFAQs(userMessage: string): Promise<{ faq: FAQ | null; matchScore: number; softMatches: FAQ[] }> {
  try {
    const lowerMessage = userMessage.toLowerCase()
    const keywords = lowerMessage.split(/\s+/).filter((w) => w.length > 3)

    const snapshot = await getAdminDb().collection('faqs').get()
    const faqs = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as FAQ)
      .filter(isFaqUsable)

    let bestMatch: FAQ | null = null
    let bestScore = 0
    const scored: Array<{ faq: FAQ; score: number }> = []

    for (const faq of faqs) {
      let score = 0
      const faqText = `${faq.question} ${faq.answer}`.toLowerCase()

      if (faqText.includes(userMessage.toLowerCase())) {
        score += 100
      }

      for (const keyword of keywords) {
        if (faqText.includes(keyword)) {
          score += 10
        }
      }

      const faqQuestionWords = faq.question.toLowerCase().split(/\s+/)
      const userWords = lowerMessage.split(/\s+/)
      for (const word of userWords) {
        if (word.length > 2 && faqQuestionWords.includes(word)) {
          score += 5
        }
      }

      if (score > 0) scored.push({ faq, score })
      if (score > bestScore) {
        bestScore = score
        bestMatch = faq
      }
    }

    scored.sort((a, b) => b.score - a.score)
    return {
      faq: bestMatch,
      matchScore: bestScore,
      softMatches: scored.slice(0, 3).map((s) => s.faq),
    }
  } catch (error) {
    console.error('[v0] Error searching FAQs:', error)
    return { faq: null, matchScore: 0, softMatches: [] }
  }
}

async function loadActiveKnowledge(): Promise<ChatbotKnowledgeItem[]> {
  try {
    const snap = await getAdminDb().collection('chatbotKnowledge').get()
    return snap.docs
      .map((docSnap) => normalizeKnowledgeDoc(docSnap.id, docSnap.data() as Record<string, unknown>))
      .filter((item) => item.status === 'active' && item.content.trim())
      .sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (error) {
    console.error('[v0] Error loading chatbot knowledge:', error)
    return []
  }
}

async function loadWhatsAppLink(): Promise<string> {
  try {
    const snap = await getAdminDb().collection('platformConfig').doc('globalSettings').get()
    const settings = mergeGlobalSettings(snap.data() as Record<string, unknown> | undefined)
    return settings.whatsappLink?.trim() || ''
  } catch (error) {
    console.warn('[v0] Could not load WhatsApp link for chat:', error)
    return ''
  }
}

function selectKnowledgeForPrompt(
  userMessage: string,
  items: ChatbotKnowledgeItem[]
): ChatbotKnowledgeItem[] {
  const selected: ChatbotKnowledgeItem[] = []
  const seen = new Set<string>()

  for (const item of items) {
    if (item.alwaysInclude) {
      selected.push(item)
      seen.add(item.id)
    }
  }

  const matched = items
    .filter((item) => !seen.has(item.id))
    .map((item) => ({ item, score: scoreKnowledgeMatch(userMessage, item) }))
    .filter((row) => row.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  for (const row of matched) {
    selected.push(row.item)
  }

  return selected
}

function buildSystemPrompt(input: {
  knowledge: ChatbotKnowledgeItem[]
  whatsappLink: string
  softFaqs: FAQ[]
}): string {
  const parts: string[] = [
    `You are a helpful assistant for Passive Blessings, a community platform for events, volunteering, and community support.
Be concise, friendly, and focus on helping users navigate the platform or understand our mission.
When the knowledge below includes a link or exact contact text that answers the user, paste it verbatim — do not invent URLs or change them.
If you don't know the answer from the knowledge below, suggest they contact support.`,
  ]

  if (input.whatsappLink) {
    parts.push(`\nOfficial WhatsApp link (from site settings):\n${input.whatsappLink}`)
  }

  if (input.knowledge.length > 0) {
    parts.push('\nAdmin knowledge (use when relevant):')
    for (const item of input.knowledge) {
      parts.push(`\n### ${item.title}\n${item.content}`)
    }
  }

  if (input.softFaqs.length > 0) {
    parts.push('\nRelated FAQ excerpts (for context, paraphrase only if needed):')
    for (const faq of input.softFaqs) {
      parts.push(`\nQ: ${faq.question}\nA: ${faq.answer}`)
    }
  }

  return parts.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, conversationId } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    const lastUserMessage = messages[messages.length - 1]?.content || ''

    const [{ faq, matchScore, softMatches }, knowledgeItems, whatsappLink] = await Promise.all([
      searchFAQs(lastUserMessage),
      loadActiveKnowledge(),
      loadWhatsAppLink(),
    ])

    let response = ''
    let faqSourceData = null

    if (faq && matchScore > 25) {
      response = faq.answer
      faqSourceData = {
        id: faq.id,
        question: faq.question,
        category: faq.category,
      }
      console.log(`[v0] FAQ match found: ${faq.question} (score: ${matchScore})`)
    } else {
      const apiKey = await resolveAnthropicApiKey()
      if (apiKey) {
        const knowledgeForPrompt = selectKnowledgeForPrompt(lastUserMessage, knowledgeItems)
        const client = new Anthropic({ apiKey })
        const aiResult = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          system: buildSystemPrompt({
            knowledge: knowledgeForPrompt,
            whatsappLink,
            softFaqs: softMatches,
          }),
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        })
        const textBlock = aiResult.content.find((block) => block.type === 'text')
        response = textBlock && textBlock.type === 'text' ? textBlock.text : ''
        console.log(
          `[v0] Claude reply with ${knowledgeForPrompt.length} knowledge snippet(s), whatsapp=${Boolean(whatsappLink)}`
        )
      } else {
        response =
          "I couldn't find a matching answer in our FAQ. Please contact support for help."
        console.log('[v0] No FAQ match and Anthropic API key not configured')
      }
    }

    return NextResponse.json({
      message: response,
      conversationId,
      faqSource: faqSourceData,
      faqMatch: Boolean(faq && matchScore > 25),
    })
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
