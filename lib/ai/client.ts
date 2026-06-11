import { Anthropic } from '@anthropic-ai/sdk'
import { SYSTEM_PROMPTS } from './constants'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type UserRole = 'donor' | 'beneficiary' | 'sponsor' | 'admin' | 'user'

export async function getSystemPrompt(userRole?: UserRole): Promise<string> {
  const role = userRole || 'user'
  return SYSTEM_PROMPTS[role as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.general
}

export async function generateChatResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userRole?: UserRole
): Promise<string> {
  const systemPrompt = await getSystemPrompt(userRole)

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages,
  })

  const textContent = response.content.find(block => block.type === 'text')
  if (textContent && textContent.type === 'text') {
    return textContent.text
  }

  return 'I apologize, but I was unable to generate a response. Please try again.'
}

export async function streamChatResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userRole?: UserRole
) {
  const systemPrompt = await getSystemPrompt(userRole)

  const stream = await client.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages,
  })

  return stream
}

export function categorizeIssue(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('donate') || lowerMessage.includes('donation')) return 'donations'
  if (lowerMessage.includes('sponsor') || lowerMessage.includes('sponsorship')) return 'sponsorships'
  if (lowerMessage.includes('beneficiary') || lowerMessage.includes('receive')) return 'beneficiaries'
  if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('issue')) return 'technical_issues'
  if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('where')) return 'feature_questions'
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) return 'billing'
  if (lowerMessage.includes('account') || lowerMessage.includes('profile')) return 'account_help'
  if (lowerMessage.includes('partner') || lowerMessage.includes('partnership')) return 'partnerships'

  return 'other'
}

export function detectSentiment(message: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['great', 'thank', 'love', 'perfect', 'excellent', 'amazing', 'good', 'helpful']
  const negativeWords = ['bad', 'terrible', 'hate', 'angry', 'frustrated', 'awful', 'horrible', 'issue', 'problem', 'error']

  const lowerMessage = message.toLowerCase()

  let positiveCount = 0
  let negativeCount = 0

  positiveWords.forEach(word => {
    if (lowerMessage.includes(word)) positiveCount++
  })

  negativeWords.forEach(word => {
    if (lowerMessage.includes(word)) negativeCount++
  })

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}
