import Anthropic from '@anthropic-ai/sdk'
import { getAdminDb } from '@/lib/firebase-admin'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'
import { normalizeKnowledgeDoc } from '@/lib/chatbot-knowledge'
import { resolveAnthropicModel } from '@/lib/resolve-anthropic-key'

export type AnthropicKeySource = 'vault' | 'env' | 'none'

export type ChatbotDiagnostics = {
  anthropic: {
    configured: boolean
    source: AnthropicKeySource
    model: string
    integrationStatus: string | null
    keyLooksValid: boolean
    probe: null | {
      ok: boolean
      latencyMs: number
      error: string | null
    }
  }
  faqs: { usable: number; total: number }
  knowledge: { active: number; total: number; alwaysInclude: number }
  recommendation: string
  checkedAt: string
}

function looksLikeAnthropicKey(key: string): boolean {
  const k = key.trim()
  return k.startsWith('sk-ant-') || k.startsWith('sk-')
}

async function resolveKeySource(): Promise<{
  key: string | null
  source: AnthropicKeySource
  integrationStatus: string | null
}> {
  let integrationStatus: string | null = null

  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'anthropic')
    integrationStatus = integration?.status || null
    const vaultKey = integration?.credentials?.apiKey
    if (typeof vaultKey === 'string' && vaultKey.trim()) {
      return {
        key: vaultKey.trim(),
        source: 'vault',
        integrationStatus,
      }
    }
  } catch {
    /* fall through to env */
  }

  const envKey = process.env.ANTHROPIC_API_KEY
  if (typeof envKey === 'string' && envKey.trim()) {
    return { key: envKey.trim(), source: 'env', integrationStatus }
  }

  return { key: null, source: 'none', integrationStatus }
}

async function countFaqs(): Promise<{ usable: number; total: number }> {
  try {
    const snap = await getAdminDb().collection('faqs').get()
    let usable = 0
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as Record<string, unknown>
      const status = String(data.status || '').toLowerCase()
      const answer = String(data.answer || '').trim()
      if (!answer) continue
      if (status === 'draft' || status === 'archived' || status === 'inactive') continue
      if (data.isActive === false) continue
      usable += 1
    }
    return { usable, total: snap.size }
  } catch {
    return { usable: 0, total: 0 }
  }
}

async function countKnowledge(): Promise<{
  active: number
  total: number
  alwaysInclude: number
}> {
  try {
    const snap = await getAdminDb().collection('chatbotKnowledge').get()
    let active = 0
    let alwaysInclude = 0
    for (const docSnap of snap.docs) {
      const item = normalizeKnowledgeDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
      if (item.status === 'active' && item.content.trim()) {
        active += 1
        if (item.alwaysInclude) alwaysInclude += 1
      }
    }
    return { active, total: snap.size, alwaysInclude }
  } catch {
    return { active: 0, total: 0, alwaysInclude: 0 }
  }
}

async function probeAnthropic(
  apiKey: string,
  model: string
): Promise<{ ok: boolean; latencyMs: number; error: string | null }> {
  const started = Date.now()
  try {
    const client = new Anthropic({ apiKey })
    await client.messages.create({
      model,
      max_tokens: 8,
      messages: [{ role: 'user', content: 'Reply with OK only.' }],
    })
    return { ok: true, latencyMs: Date.now() - started, error: null }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***')
        : 'Anthropic request failed'
    return { ok: false, latencyMs: Date.now() - started, error: message }
  }
}

function buildRecommendation(input: {
  source: AnthropicKeySource
  configured: boolean
  keyLooksValid: boolean
  probeOk: boolean | null
  faqUsable: number
  knowledgeActive: number
}): string {
  if (!input.configured) {
    return 'Anthropic is not connected. Save an API key under Admin → Integrations → Anthropic Claude (Messaging), or set ANTHROPIC_API_KEY on the server. Until then the chatbot uses FAQ keyword matching only.'
  }
  if (!input.keyLooksValid) {
    return 'An Anthropic key is stored but does not look like a valid sk-ant- key. Re-save the key from console.anthropic.com.'
  }
  if (input.probeOk === false) {
    return 'Anthropic is configured but the live API probe failed. Check the key, model ID, billing, and INTEGRATION_ENCRYPTION_KEY (must match the key used when the credential was saved).'
  }
  if (input.faqUsable === 0 && input.knowledgeActive === 0) {
    return 'Claude can connect, but FAQs and knowledge docs are empty — add training content under Chatbot → Knowledge and FAQs so answers stay accurate.'
  }
  if (input.probeOk === true) {
    return 'Anthropic is online. The chatbot will use Claude with your FAQs and knowledge docs.'
  }
  return 'Anthropic key is present. Run “Test Claude connection” to verify the API call succeeds.'
}

/** Admin diagnostics for PB Assistant (never returns raw API keys). */
export async function getChatbotDiagnostics(options?: {
  probe?: boolean
}): Promise<ChatbotDiagnostics> {
  const [{ key, source, integrationStatus }, modelOverride, faqs, knowledge] = await Promise.all([
    resolveKeySource(),
    resolveAnthropicModel(),
    countFaqs(),
    countKnowledge(),
  ])

  const model = modelOverride || 'claude-3-5-haiku-20241022'
  const configured = Boolean(key)
  const keyLooksValid = configured ? looksLikeAnthropicKey(key!) : false

  let probe: ChatbotDiagnostics['anthropic']['probe'] = null
  if (options?.probe && key) {
    probe = await probeAnthropic(key, model)
  }

  return {
    anthropic: {
      configured,
      source,
      model,
      integrationStatus,
      keyLooksValid,
      probe,
    },
    faqs,
    knowledge,
    recommendation: buildRecommendation({
      source,
      configured,
      keyLooksValid,
      probeOk: probe ? probe.ok : null,
      faqUsable: faqs.usable,
      knowledgeActive: knowledge.active,
    }),
    checkedAt: new Date().toISOString(),
  }
}
