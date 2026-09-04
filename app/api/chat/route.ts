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
import { generateConversationalSupportReply } from '@/lib/chatbot-converse'

function isFaqUsable(faq: ChatFaq): boolean {
  const status = String(faq.status || '').toLowerCase()
  if (status === 'draft' || status === 'archived' || status === 'inactive') return false
  if (status === 'published' || status === 'active') return Boolean(String(faq.answer || '').trim())
  if (faq.isActive === false) return false
  return Boolean(String(faq.answer || '').trim())
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
 * Conversational support chatbot.
 * Prefers Anthropic + private FAQ/training context; falls back to retrieval-only.
 * Never discloses FAQ / training-doc sources to the visitor.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, conversationId } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    const normalized = messages
      .map((m: { role?: string; content?: string }) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: String(m.content || '').trim(),
      }))
      .filter((m: { content: string }) => m.content)

    const lastUserMessage = [...normalized].reverse().find((m) => m.role === 'user')?.content || ''

    const [faqs, knowledgeItems, whatsappLink] = await Promise.all([
      loadUsableFaqs(),
      loadActiveKnowledge(),
      loadWhatsAppLink(),
    ])

    const conversational = await generateConversationalSupportReply({
      messages: normalized,
      faqs,
      knowledge: knowledgeItems,
      whatsappLink,
    })

    if (conversational) {
      console.log(
        `[v0] Chat converse: faqs=${faqs.length} knowledge=${knowledgeItems.length} msgLen=${lastUserMessage.length}`
      )
      return NextResponse.json({
        message: conversational,
        conversationId,
        engine: 'anthropic',
      })
    }

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
      engine: 'retrieval',
    })
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
