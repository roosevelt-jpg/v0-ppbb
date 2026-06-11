import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'
import { generateChatResponse, categorizeIssue, detectSentiment, UserRole } from '@/lib/ai/client'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = getFirestore()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, conversationId, userId } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    // Get user role from Firestore
    let userRole: UserRole = 'user'
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get()
      if (userDoc.exists()) {
        const role = userDoc.data()?.role
        if (['donor', 'beneficiary', 'sponsor', 'admin'].includes(role)) {
          userRole = role as UserRole
        }
      }
    }

    // Get AI response
    const response = await generateChatResponse(messages, userRole)

    // Categorize and detect sentiment
    const lastUserMessage = messages[messages.length - 1]?.content || ''
    const category = categorizeIssue(lastUserMessage)
    const sentiment = detectSentiment(lastUserMessage)

    // Save to Firestore if conversationId provided
    if (conversationId && userId) {
      try {
        const conversationRef = db.collection('conversations').doc(conversationId)

        // Add messages to conversation
        await conversationRef.update({
          messages: [
            ...messages,
            { role: 'assistant', content: response, timestamp: new Date() },
          ],
          lastMessageAt: new Date(),
          category,
          sentiment,
          status: 'active',
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
    })
  } catch (error) {
    console.error('[v0] Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
