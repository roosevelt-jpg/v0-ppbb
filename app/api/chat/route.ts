import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'
import { generateChatResponse, categorizeIssue, detectSentiment, UserRole } from '@/lib/ai/client'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = getFirestore()

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

    const q = query(collection(db, 'faqs'), where('isActive', '==', true))
    const snapshot = await getDocs(q)
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
      // Fall back to AI generation if no good FAQ match
      response = await generateChatResponse(messages, 'user')
      console.log('[v0] No strong FAQ match, using AI response')
    }

    // Categorize and detect sentiment
    const category = categorizeIssue(lastUserMessage)
    const sentiment = detectSentiment(lastUserMessage)

    // Save to Firestore if conversationId provided
    if (conversationId && userId) {
      try {
        const conversationRef = db.collection('conversations').doc(conversationId)
        const currentDoc = await conversationRef.get()
        const existingMessages = currentDoc.data()?.messages || []

        await conversationRef.update({
          messages: [
            ...existingMessages,
            { role: 'user', content: lastUserMessage, timestamp: new Date() },
            { role: 'assistant', content: response, timestamp: new Date(), faqSourceId },
          ],
          lastMessageAt: new Date(),
          category,
          sentiment,
          status: 'active',
          faqSourceId: faqSourceId || null,
          updatedAt: new Date(),
        })
      } catch (error) {
        console.error('[v0] Error saving conversation:', error)
        // Continue even if save fails
      }
    }

    return NextResponse.json({
      message: response,
      category,
      sentiment,
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
