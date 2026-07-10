import { resolveZiinaConfig, ZIINA_API_BASE } from '@/lib/resolve-ziina-config'

export type ZiinaPaymentStatus =
  | 'requires_payment_instrument'
  | 'requires_user_action'
  | 'pending'
  | 'completed'
  | 'failed'
  | 'canceled'

export interface ZiinaPaymentIntent {
  id: string
  status: ZiinaPaymentStatus
  redirect_url?: string
  amount?: number
  currency_code?: string
}

async function ziinaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = await resolveZiinaConfig()
  if (!config) throw new Error('Ziina is not configured')

  const res = await fetch(`${ZIINA_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Ziina ${path} failed: ${res.status} ${JSON.stringify(data)}`)
  }
  return data as T
}

/** Amount must be in minor units (fils/cents), e.g. 10.50 AED → 1050. */
export async function createZiinaPaymentIntent(params: {
  amountMinor: number
  currency: string
  message: string
  successUrl: string
  cancelUrl: string
  failureUrl?: string
}): Promise<ZiinaPaymentIntent> {
  const config = await resolveZiinaConfig()
  if (!config) throw new Error('Ziina is not configured')

  return ziinaFetch<ZiinaPaymentIntent>('/payment_intent', {
    method: 'POST',
    body: JSON.stringify({
      amount: Math.round(params.amountMinor),
      currency_code: params.currency.toUpperCase(),
      message: params.message.slice(0, 500),
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      failure_url: params.failureUrl || params.cancelUrl,
      test: config.testMode,
    }),
  })
}

export async function getZiinaPaymentIntent(id: string): Promise<ZiinaPaymentIntent> {
  return ziinaFetch<ZiinaPaymentIntent>(`/payment_intent/${encodeURIComponent(id)}`, {
    method: 'GET',
  })
}
