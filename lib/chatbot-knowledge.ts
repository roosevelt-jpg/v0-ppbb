export type ChatbotKnowledgeStatus = 'active' | 'archived'

export interface ChatbotKnowledgeItem {
  id: string
  title: string
  content: string
  /** Comma or newline separated trigger phrases/keywords */
  triggers: string
  alwaysInclude: boolean
  status: ChatbotKnowledgeStatus
  sortOrder: number
  /** Original uploaded file name when created from a training doc */
  sourceFileName?: string
  updatedAt?: string
  updatedBy?: string
  createdAt?: string
}

export type ChatbotKnowledgeInput = {
  id?: string
  title: string
  content: string
  triggers?: string
  alwaysInclude?: boolean
  status?: ChatbotKnowledgeStatus
  sortOrder?: number
  sourceFileName?: string
}

export function parseTriggers(triggers: string): string[] {
  return String(triggers || '')
    .split(/[\n,]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 1)
}

/** Score how well a knowledge item matches the user message (0 = no match). */
export function scoreKnowledgeMatch(
  userMessage: string,
  item: Pick<ChatbotKnowledgeItem, 'title' | 'content' | 'triggers' | 'sourceFileName'>
): number {
  const lower = userMessage.toLowerCase()
  const keywords = lower.split(/\s+/).filter((w) => w.length > 2)
  let score = 0

  const triggerList = parseTriggers(item.triggers)
  for (const trigger of triggerList) {
    if (lower.includes(trigger)) {
      score += trigger.includes(' ') ? 40 : 25
    }
  }

  const haystack = `${item.title} ${item.sourceFileName || ''} ${item.content}`.toLowerCase()
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 5
    if (item.title.toLowerCase().includes(keyword)) score += 4
    if (triggerList.some((t) => t.includes(keyword) || keyword.includes(t))) score += 8
  }

  // Phrase overlap: consecutive bigrams from the question appearing in the doc
  const words = keywords
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`
    if (haystack.includes(bigram)) score += 12
  }

  return score
}

export function normalizeKnowledgeDoc(
  id: string,
  data: Record<string, unknown>
): ChatbotKnowledgeItem {
  const status = data.status === 'archived' ? 'archived' : 'active'
  return {
    id,
    title: String(data.title || ''),
    content: String(data.content || ''),
    triggers: String(data.triggers || ''),
    alwaysInclude: Boolean(data.alwaysInclude),
    status,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : Number(data.sortOrder) || 0,
    sourceFileName:
      typeof data.sourceFileName === 'string' && data.sourceFileName.trim()
        ? data.sourceFileName.trim()
        : undefined,
    updatedAt:
      typeof data.updatedAt === 'string'
        ? data.updatedAt
        : data.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === 'function'
          ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
          : undefined,
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === 'function'
          ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
          : undefined,
  }
}
