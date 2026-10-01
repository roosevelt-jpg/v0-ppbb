'use client'

import React from 'react'
import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Loader2, Lock } from 'lucide-react'

let stripePromiseCache: Promise<StripeJS | null> | null = null
let cachedPublishableKey: string | null = null

function getStripePromise(publishableKey: string) {
  if (!stripePromiseCache || cachedPublishableKey !== publishableKey) {
    cachedPublishableKey = publishableKey
    stripePromiseCache = loadStripe(publishableKey)
  }
  return stripePromiseCache
}

interface StripeCardCheckoutProps {
  publishableKey: string
  clientSecret: string
  /** payment = charge now; setup = save card for trial (no charge yet). */
  mode: 'payment' | 'setup'
  /** For payment mode, receives the PaymentIntent id when available. */
  onSuccess: (paymentIntentId?: string) => void
  onCancel?: () => void
  submitLabel?: string
}

/**
 * On-site Stripe payment form. Shows Apple Pay and Google Pay when the phone
 * and Stripe dashboard allow them, plus the card form.
 */
export function StripeCardCheckout({
  publishableKey,
  clientSecret,
  mode,
  onSuccess,
  onCancel,
  submitLabel = mode === 'setup' ? 'Save card — start free period' : 'Subscribe',
}: StripeCardCheckoutProps) {
  const stripePromise = React.useMemo(() => getStripePromise(publishableKey), [publishableKey])

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: 'en',
      }}
    >
      <WalletCheckoutForm
        mode={mode}
        onSuccess={onSuccess}
        onCancel={onCancel}
        submitLabel={submitLabel}
      />
    </Elements>
  )
}

function WalletCheckoutForm({
  mode,
  onSuccess,
  onCancel,
  submitLabel,
}: {
  mode: 'payment' | 'setup'
  onSuccess: (paymentIntentId?: string) => void
  onCancel?: () => void
  submitLabel: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'Payment could not be started')
      setSubmitting(false)
      return
    }

    const confirmParams = { return_url: window.location.href }

    if (mode === 'setup') {
      const { error: confirmError } = await stripe.confirmSetup({
        elements,
        confirmParams,
        redirect: 'if_required',
      })
      if (confirmError) {
        setError(confirmError.message || 'Payment could not be confirmed. Please try again.')
        setSubmitting(false)
        return
      }
      onSuccess()
      return
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams,
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment could not be confirmed. Please try again.')
      setSubmitting(false)
      return
    }

    onSuccess(paymentIntent?.id)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-neutral-500 text-center flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" />
        Apple Pay, Google Pay, and cards are processed on this page.
      </p>
    </form>
  )
}
