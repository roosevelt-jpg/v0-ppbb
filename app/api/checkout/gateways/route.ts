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
      // Both keys are required: the secret key to actually charge, and the
      // publishable key for stripe.js to render the embedded card form.
      // Reporting "configured" on the secret key alone let checkout resolve
      // to Stripe and open a card-entry dialog with nothing inside it.
      stripe: Boolean(stripe?.secretKey && stripe?.publishableKey),
      // Publishable keys are safe to expose client-side by design — this is
      // what stripe.js needs to render the embedded card form.
      stripePublishableKey: stripe?.publishableKey || null,
      paypal: Boolean(paypal?.clientId && paypal?.clientSecret),
      ziina: Boolean(ziina?.apiToken),
    },
  })
}
