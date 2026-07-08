import { NextRequest, NextResponse } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'
import { getAdminDb } from '@/lib/firebase-admin'
import { resolveAnthropicApiKey } from '@/lib/resolve-anthropic-key'

const db = getAdminDb()

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  isActive: boolean
  order: number
}

// Search FAQs for matching content
async function searchFAQs(userMessage: string): Promise<{ faq: FAQ | null; matchScore: number }> {
  try {
    const lowerMessage = userMessage.toLowerCase()
    const keywords = lowerMessage.split(/\s+/).filter(w => w.length > 3)

    const snapshot = await db.collection('faqs').where('isActive', '==', true).get()
    const faqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FAQ[]

    let bestMatch: FAQ | null = null
    let bestScore = 0

    for (const faq of faqs) {
      let score = 0
      const faqText = `${faq.question} ${faq.answer}`.toLowerCase()

      // Exact phrase match (highest priority)
      if (faqText.includes(userMessage.toLowerCase())) {
        score += 100
      }

      // Keyword matches
      for (const keyword of keywords) {
        if (faqText.includes(keyword)) {
          score += 10
        }
      }

      // Question similarity
      const faqQuestionWords = faq.question.toLowerCase().split(/\s+/)
      const userWords = lowerMessage.split(/\s+/)
      for (const word of userWords) {
        if (faqQuestionWords.includes(word)) {
          score += 5
        }
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = faq
      }
    }

    return { faq: bestMatch, matchScore: bestScore }
  } catch (error) {
    console.error('[v0] Error searching FAQs:', error)
    return { faq: null, matchScore: 0 }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, conversationId, userId } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1]?.content || ''

    // Search FAQs for matching answer
    const { faq, matchScore } = await searchFAQs(lastUserMessage)

    let response = ''
    let faqSourceId = null
    let faqSourceData = null

    // Use FAQ answer if match score is high enough (> 25)
    if (faq && matchScore > 25) {
      response = faq.answer
      faqSourceId = faq.id
      faqSourceData = {
        id: faq.id,
        question: faq.question,
        category: faq.category,
      }
      console.log(`[v0] FAQ match found: ${faq.question} (score: ${matchScore})`)
    } else {
      const apiKey = await resolveAnthropicApiKey()
      if (apiKey) {
        const client = new Anthropic({ apiKey })
        const aiResult = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          system: `You are a helpful assistant for Passive Blessings, a community platform for events, volunteering, and community support.
Be concise, friendly, and focus on helping users navigate the platform or understand our mission.
If you don't know the answer, suggest they contact support at contact@passiveblessings.org.`,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        })
        const textBlock = aiResult.content.find((block) => block.type === 'text')
        response = textBlock && textBlock.type === 'text' ? textBlock.text : ''
        console.log('[v0] No strong FAQ match, using Anthropic response')
      } else {
        response =
          "I couldn't find a matching answer in our FAQ. Please contact support at contact@passiveblessings.org for help."
        console.log('[v0] No FAQ match and Anthropic API key not configured')
      }
    }



    return NextResponse.json({
      message: response,
      conversationId,
      faqSource: faqSourceData,
      faqMatch: faq ? true : false,
    })
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
