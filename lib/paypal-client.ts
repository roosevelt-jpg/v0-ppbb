import {
  paypalApiBase,
  resolvePayPalConfig,
  type PayPalConfig,
} from '@/lib/resolve-paypal-config'

async function getAccessToken(config: PayPalConfig): Promise<string> {
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
  const res = await fetch(`${paypalApiBase(config.mode)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal auth failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { access_token?: string }
  if (!data.access_token) throw new Error('PayPal auth failed: missing access_token')
  return data.access_token
}

async function paypalFetch<T>(
  path: string,
  init: RequestInit & { config?: PayPalConfig } = {}
): Promise<T> {
  const config = init.config || (await resolvePayPalConfig())
  if (!config) throw new Error('PayPal is not configured')
  const token = await getAccessToken(config)
  const { config: _c, ...rest } = init
  const res = await fetch(`${paypalApiBase(config.mode)}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(rest.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      `PayPal ${path} failed: ${res.status} ${JSON.stringify(data)}`
    )
  }
  return data as T
}

export async function createPayPalOrder(params: {
  amountMajor: number
  currency: string
  description: string
  returnUrl: string
  cancelUrl: string
  customId?: string
}): Promise<{ id: string; approveUrl: string }> {
  const value = params.amountMajor.toFixed(2)
  const order = await paypalFetch<{
    id: string
    links?: Array<{ rel: string; href: string }>
  }>('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: params.currency.toUpperCase(),
            value,
          },
          description: params.description.slice(0, 127),
          custom_id: params.customId?.slice(0, 127),
        },
      ],
      application_context: {
        brand_name: process.env.NEXT_PUBLIC_APP_NAME || 'Passive Blessings',
        user_action: 'PAY_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  })
  const approveUrl = order.links?.find((l) => l.rel === 'approve')?.href
  if (!approveUrl) throw new Error('PayPal order missing approve link')
  return { id: order.id, approveUrl }
}

export async function capturePayPalOrder(orderId: string): Promise<{
  id: string
  status: string
}> {
  const existing = await getPayPalOrder(orderId)
  if (String(existing.status).toUpperCase() === 'COMPLETED') {
    return existing
  }
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function getPayPalOrder(orderId: string): Promise<{
  id: string
  status: string
}> {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
  })
}

export async function ensurePayPalBillingPlan(params: {
  planId: string
  name: string
  description?: string
  priceCents: number
  currency: string
  billingPeriod: string
  existingProductId?: string
  existingPlanId?: string
}): Promise<{ productId: string; paypalPlanId: string }> {
  if (params.existingPlanId && params.existingProductId) {
    return { productId: params.existingProductId, paypalPlanId: params.existingPlanId }
  }

  let productId = params.existingProductId
  if (!productId) {
    const product = await paypalFetch<{ id: string }>('/v1/catalogs/products', {
      method: 'POST',
      body: JSON.stringify({
        name: params.name.slice(0, 127),
        description: (params.description || params.name).slice(0, 256),
        type: 'SERVICE',
        category: 'SOFTWARE',
      }),
    })
    productId = product.id
  }

  let paypalPlanId = params.existingPlanId
  if (!paypalPlanId) {
    const plan = await paypalFetch<{ id: string }>('/v1/billing/plans', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        name: params.name.slice(0, 127),
        description: (params.description || params.name).slice(0, 127),
        billing_cycles: [
          {
            frequency: {
              interval_unit: params.billingPeriod === 'yearly' ? 'YEAR' : 'MONTH',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: (params.priceCents / 100).toFixed(2),
                currency_code: params.currency.toUpperCase(),
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 3,
        },
      }),
    })
    paypalPlanId = plan.id
  }

  return { productId: productId!, paypalPlanId: paypalPlanId! }
}

export async function createPayPalSubscription(params: {
  paypalPlanId: string
  email?: string
  returnUrl: string
  cancelUrl: string
  customId?: string
}): Promise<{ id: string; approveUrl: string }> {
  const subscription = await paypalFetch<{
    id: string
    links?: Array<{ rel: string; href: string }>
  }>('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: params.paypalPlanId,
      custom_id: params.customId?.slice(0, 127),
      subscriber: params.email ? { email_address: params.email } : undefined,
      application_context: {
        brand_name: process.env.NEXT_PUBLIC_APP_NAME || 'Passive Blessings',
        locale: 'en-US',
        user_action: 'SUBSCRIBE_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  })
  const approveUrl = subscription.links?.find((l) => l.rel === 'approve')?.href
  if (!approveUrl) throw new Error('PayPal subscription missing approve link')
  return { id: subscription.id, approveUrl }
}

export async function getPayPalSubscription(subscriptionId: string): Promise<{
  id: string
  status: string
}> {
  return paypalFetch(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'GET',
  })
}
