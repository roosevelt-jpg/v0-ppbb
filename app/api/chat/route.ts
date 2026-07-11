import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { mergeGlobalSettings } from '@/lib/global-settings'
import {
  normalizeKnowledgeDoc,
  type ChatbotKnowledgeItem,
} from '@/lib/chatbot-knowledge'
import {
  retrieveChatAnswer,
  type ChatFaq,
} from '@/lib/chatbot-retrieval'

function isFaqUsable(faq: ChatFaq): boolean {
  if (faq.status === 'published') return true
  if (faq.status === 'draft') return false
  return faq.isActive === true
}

async function loadUsableFaqs(): Promise<ChatFaq[]> {
  try {
    const snapshot = await getAdminDb().collection('faqs').get()
    return snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as ChatFaq)
      .filter(isFaqUsable)
  } catch (error) {
    console.error('[v0] Error loading FAQs for chat:', error)
    return []
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

/**
 * FAQ + AI training docs retrieval chatbot (no Anthropic / external LLM).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, conversationId } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    const lastUserMessage = String(messages[messages.length - 1]?.content || '').trim()

    const [faqs, knowledgeItems, whatsappLink] = await Promise.all([
      loadUsableFaqs(),
      loadActiveKnowledge(),
      loadWhatsAppLink(),
    ])

    const result = retrieveChatAnswer({
      userMessage: lastUserMessage,
      faqs,
      knowledge: knowledgeItems,
      whatsappLink,
    })

    console.log(
      `[v0] Chat retrieval: source=${result.source} score=${result.matchScore}` +
        (result.faqSource ? ` faq="${result.faqSource.question}"` : '') +
        (result.knowledgeSource ? ` knowledge="${result.knowledgeSource.title}"` : '')
    )

    return NextResponse.json({
      message: result.message,
      conversationId,
      faqSource: result.faqSource,
      faqMatch: result.source === 'faq',
      knowledgeSource: result.knowledgeSource,
      knowledgeMatch: result.source === 'knowledge',
      matchScore: result.matchScore,
      engine: 'faq-knowledge',
    })
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
