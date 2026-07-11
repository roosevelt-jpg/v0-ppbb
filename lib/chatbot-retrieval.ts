import {
  scoreKnowledgeMatch,
  type ChatbotKnowledgeItem,
} from '@/lib/chatbot-knowledge'

export interface ChatFaq {
  id: string
  question: string
  answer: string
  category: string
  isActive?: boolean
  status?: string
}

export type RetrievalSource = 'faq' | 'knowledge' | 'fallback'

export interface RetrievalResult {
  message: string
  source: RetrievalSource
  faqSource: { id: string; question: string; category: string } | null
  knowledgeSource: { id: string; title: string } | null
  matchScore: number
}

const FAQ_DIRECT_THRESHOLD = 20
const KNOWLEDGE_DIRECT_THRESHOLD = 15
const MAX_ANSWER_CHARS = 1200

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

/** Score an FAQ against the user message. */
export function scoreFaqMatch(userMessage: string, faq: ChatFaq): number {
  const lowerMessage = userMessage.toLowerCase().trim()
  if (!lowerMessage) return 0

  let score = 0
  const faqText = `${faq.question} ${faq.answer}`.toLowerCase()
  const keywords = tokenize(userMessage)

  if (faqText.includes(lowerMessage)) score += 100

  for (const keyword of keywords) {
    if (faqText.includes(keyword)) score += 10
  }

  const faqQuestionWords = tokenize(faq.question)
  const userWords = tokenize(userMessage)
  for (const word of userWords) {
    if (faqQuestionWords.includes(word)) score += 5
  }

  // Light boost when many trigger-like overlaps with the question
  const overlap = userWords.filter((w) => faqQuestionWords.includes(w)).length
  if (overlap >= 2) score += overlap * 3

  return score
}

/**
 * Pull the most relevant passage from a long training doc.
 * Short content is returned as-is.
 */
export function extractBestPassage(content: string, userMessage: string): string {
  const trimmed = content.trim()
  if (!trimmed) return ''
  if (trimmed.length <= MAX_ANSWER_CHARS) return trimmed

  const chunks = trimmed
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z])/)
    .map((c) => c.trim())
    .filter((c) => c.length > 40)

  if (chunks.length === 0) {
    return trimmed.slice(0, MAX_ANSWER_CHARS).trim() + (trimmed.length > MAX_ANSWER_CHARS ? '…' : '')
  }

  const keywords = tokenize(userMessage)
  let best = chunks[0]!
  let bestScore = -1

  for (const chunk of chunks) {
    const lower = chunk.toLowerCase()
    let score = 0
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score += 5
    }
    // Prefer mid-length informative passages
    if (chunk.length > 80 && chunk.length < 600) score += 2
    if (score > bestScore) {
      bestScore = score
      best = chunk
    }
  }

  if (best.length > MAX_ANSWER_CHARS) {
    return best.slice(0, MAX_ANSWER_CHARS).trim() + '…'
  }
  return best
}

function buildFallback(whatsappLink: string): string {
  const lines = [
    "I couldn't find an exact match in our FAQ or training documents for that question.",
    'Try rephrasing, or ask about membership, events, volunteering, donations, or how to join.',
  ]
  if (whatsappLink) {
    lines.push(`You can also reach us on WhatsApp: ${whatsappLink}`)
  } else {
    lines.push('You can also contact support through the Contact page.')
  }
  return lines.join('\n\n')
}

/**
 * Answer from FAQ + knowledge only (no external LLM).
 * Always returns a message.
 */
export function retrieveChatAnswer(input: {
  userMessage: string
  faqs: ChatFaq[]
  knowledge: ChatbotKnowledgeItem[]
  whatsappLink?: string
}): RetrievalResult {
  const userMessage = String(input.userMessage || '').trim()
  const whatsappLink = input.whatsappLink?.trim() || ''

  if (!userMessage) {
    return {
      message: 'Please type a question and I will answer from our FAQ and training documents.',
      source: 'fallback',
      faqSource: null,
      knowledgeSource: null,
      matchScore: 0,
    }
  }

  const scoredFaqs = input.faqs
    .map((faq) => ({ faq, score: scoreFaqMatch(userMessage, faq) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)

  const scoredKnowledge = input.knowledge
    .map((item) => ({
      item,
      score: scoreKnowledgeMatch(userMessage, item) + (item.alwaysInclude ? 5 : 0),
    }))
    .filter((row) => row.score > 0 || row.item.alwaysInclude)
    .sort((a, b) => b.score - a.score)

  const bestFaq = scoredFaqs[0]
  const bestKnowledge = scoredKnowledge.find((row) => row.score >= KNOWLEDGE_DIRECT_THRESHOLD) || scoredKnowledge[0]

  const faqWins =
    bestFaq &&
    bestFaq.score >= FAQ_DIRECT_THRESHOLD &&
    (!bestKnowledge || bestFaq.score >= (bestKnowledge.score || 0))

  if (faqWins && bestFaq) {
    return {
      message: bestFaq.faq.answer,
      source: 'faq',
      faqSource: {
        id: bestFaq.faq.id,
        question: bestFaq.faq.question,
        category: bestFaq.faq.category,
      },
      knowledgeSource: null,
      matchScore: bestFaq.score,
    }
  }

  if (bestKnowledge && bestKnowledge.score >= KNOWLEDGE_DIRECT_THRESHOLD) {
    const passage = extractBestPassage(bestKnowledge.item.content, userMessage)
    return {
      message: passage,
      source: 'knowledge',
      faqSource: null,
      knowledgeSource: { id: bestKnowledge.item.id, title: bestKnowledge.item.title },
      matchScore: bestKnowledge.score,
    }
  }

  // Soft FAQ — still better than a dead end
  if (bestFaq && bestFaq.score > 0) {
    return {
      message: bestFaq.faq.answer,
      source: 'faq',
      faqSource: {
        id: bestFaq.faq.id,
        question: bestFaq.faq.question,
        category: bestFaq.faq.category,
      },
      knowledgeSource: null,
      matchScore: bestFaq.score,
    }
  }

  // Soft knowledge / always-include docs
  if (bestKnowledge && bestKnowledge.item.content.trim()) {
    const passage = extractBestPassage(bestKnowledge.item.content, userMessage)
    const alwaysBits = input.knowledge
      .filter((k) => k.alwaysInclude && k.id !== bestKnowledge.item.id && k.content.trim())
      .slice(0, 2)
      .map((k) => extractBestPassage(k.content, userMessage))

    const message = [passage, ...alwaysBits].filter(Boolean).join('\n\n')
    return {
      message,
      source: 'knowledge',
      faqSource: null,
      knowledgeSource: { id: bestKnowledge.item.id, title: bestKnowledge.item.title },
      matchScore: bestKnowledge.score,
    }
  }

  // Always-include only (e.g. WhatsApp facts) when nothing else matched
  const alwaysInclude = input.knowledge.filter((k) => k.alwaysInclude && k.content.trim())
  if (alwaysInclude.length > 0) {
    const message = alwaysInclude
      .slice(0, 3)
      .map((k) => extractBestPassage(k.content, userMessage))
      .join('\n\n')
    return {
      message: `${message}\n\n${buildFallback(whatsappLink)}`,
      source: 'knowledge',
      faqSource: null,
      knowledgeSource: { id: alwaysInclude[0]!.id, title: alwaysInclude[0]!.title },
      matchScore: 0,
    }
  }

  return {
    message: buildFallback(whatsappLink),
    source: 'fallback',
    faqSource: null,
    knowledgeSource: null,
    matchScore: 0,
  }
}

/** Suggest trigger keywords from a document title + opening text. */
export function suggestTriggersFromDoc(title: string, content: string): string {
  const fromTitle = tokenize(title.replace(/\.[a-z0-9]+$/i, ''))
  const fromContent = tokenize(content.slice(0, 400)).slice(0, 12)
  const triggers = Array.from(new Set([...fromTitle, ...fromContent]))
  return triggers.slice(0, 16).join(', ')
}

export function isTextTrainingFile(fileName: string, mimeType?: string): boolean {
  const lower = fileName.toLowerCase()
  if (/\.(txt|md|markdown|csv|json|html?)$/i.test(lower)) return true
  if (!mimeType) return false
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/csv' ||
    mimeType === 'text/csv'
  )
}
