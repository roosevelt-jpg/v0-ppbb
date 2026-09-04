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

const FAQ_DIRECT_THRESHOLD = 18
const FAQ_SOFT_THRESHOLD = 25
const KNOWLEDGE_DIRECT_THRESHOLD = 10
const MAX_ANSWER_CHARS = 1200

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'am',
  'be',
  'to',
  'of',
  'and',
  'or',
  'for',
  'in',
  'on',
  'at',
  'by',
  'with',
  'from',
  'how',
  'can',
  'i',
  'you',
  'we',
  'do',
  'does',
  'what',
  'when',
  'where',
  'why',
  'who',
  'my',
  'me',
  'your',
  'our',
  'it',
  'this',
  'that',
  'please',
  'help',
  'about',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
}

function smallTalkReply(userMessage: string): string | null {
  const m = userMessage.toLowerCase().trim()
  if (!m) return null
  if (/^(hi|hello|hey|yo|salam|assalamu?\s*alaikum|good\s+(morning|afternoon|evening))[\s!.?]*$/i.test(m)) {
    return "Hello! Welcome to Passive Blessings — lovely to meet you. How can I help you today?"
  }
  if (/^(thanks|thank you|thx|ty|cheers|jazak)[\s!.?]*$/i.test(m)) {
    return "You're very welcome! Happy to help anytime — anything else on your mind?"
  }
  if (/^(ok|okay|cool|great|nice|perfect|got it)[\s!.?]*$/i.test(m)) {
    return "Glad that helps. If you have another question, I'm right here."
  }
  if (/^(bye|goodbye|see you|take care)[\s!.?]*$/i.test(m)) {
    return "Take care! Come back anytime — we're glad to have you in the community."
  }
  return null
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
  const openers = [
    "I don't have a clear answer for that one just yet.",
    "That detail isn't something I can confirm on the spot.",
    "I'm not fully sure about that specific point.",
  ]
  const opener = openers[Math.floor(Math.random() * openers.length)]!
  const lines = [
    opener,
    'Feel free to ask about membership, events, volunteering, donations, or getting involved — or tell me a bit more so I can point you the right way.',
  ]
  if (whatsappLink) {
    lines.push(`For personal support: ${whatsappLink}`)
  } else {
    lines.push('You can also reach us through the Contact page.')
  }
  return lines.join('\n\n')
}

/** Present answers as natural support replies — never mention FAQ / training docs. */
export function toNaturalSupportReply(raw: string): string {
  let text = String(raw || '').trim()
  if (!text) return text

  text = text
    .replace(/\b(according to|as (?:per|stated in)|from|based on)\s+(our\s+)?(faq|faqs|frequently asked questions|training\s+docs?|training\s+documents?|knowledge\s+base|help\s+center)\b[,:\s-]*/gi, '')
    .replace(/\b(see|check|refer to)\s+(the\s+)?(faq|faqs|training\s+docs?|knowledge\s+base)\b[,:\s-]*/gi, '')
    .replace(/\b(faq|faqs|training\s+documents?)\s*(answer|says|state[sd]?)?\s*[:\-–]\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return text
}

/**
 * Answer from FAQ + knowledge only (no external LLM).
 * Always returns a message phrased for the visitor (no source disclosure).
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
      message: 'Please share your question and I will help right away.',
      source: 'fallback',
      faqSource: null,
      knowledgeSource: null,
      matchScore: 0,
    }
  }

  const chatty = smallTalkReply(userMessage)
  if (chatty) {
    return {
      message: chatty,
      source: 'fallback',
      faqSource: null,
      knowledgeSource: null,
      matchScore: 100,
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
      message: toNaturalSupportReply(bestFaq.faq.answer),
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
      message: toNaturalSupportReply(passage),
      source: 'knowledge',
      faqSource: null,
      knowledgeSource: { id: bestKnowledge.item.id, title: bestKnowledge.item.title },
      matchScore: bestKnowledge.score,
    }
  }

  // Soft FAQ — only when the match is strong enough to avoid unrelated answers
  if (bestFaq && bestFaq.score >= FAQ_SOFT_THRESHOLD) {
    return {
      message: toNaturalSupportReply(bestFaq.faq.answer),
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
