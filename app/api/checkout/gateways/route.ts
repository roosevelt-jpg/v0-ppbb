import { NextResponse } from 'next/server'
import { resolveStripeConfig } from '@/lib/resolve-stripe-key'
import { resolvePayPalConfig } from '@/lib/resolve-paypal-config'
import { resolveZiinaConfig } from '@/lib/resolve-ziina-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public: which payment gateways have credentials configured (no secrets returned). */
export async function GET() {
  const [stripe, paypal, ziina] = await Promise.all([
    resolveStripeConfig(),
    resolvePayPalConfig(),
    resolveZiinaConfig(),
  ])

  return NextResponse.json({
    success: true,
    data: {
      stripe: Boolean(stripe?.secretKey),
      paypal: Boolean(paypal?.clientId && paypal?.clientSecret),
      ziina: Boolean(ziina?.apiToken),
    },
  })
}
