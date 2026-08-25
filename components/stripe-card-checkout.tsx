'use client'

import React from 'react'
import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

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
  /** payment = an immediate charge (stripe.confirmPayment); setup = a trial, card saved but not charged yet (stripe.confirmSetup). */
  mode: 'payment' | 'setup'
  onSuccess: () => void
  onCancel?: () => void
  submitLabel?: string
}

/**
 * Embedded card-entry form — never redirects to a Stripe-hosted page.
 * A 3D Secure challenge (when the card's bank requires one) still pops an
 * in-page modal via stripe.js itself; that part can't be avoided, but the
 * member never leaves this page or sees Stripe branding beyond that modal.
 */
export function StripeCardCheckout({
  publishableKey,
  clientSecret,
  mode,
  onSuccess,
  onCancel,
  submitLabel = 'Subscribe',
}: StripeCardCheckoutProps) {
  const stripePromise = React.useMemo(() => getStripePromise(publishableKey), [publishableKey])

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <StripeCardForm mode={mode} onSuccess={onSuccess} onCancel={onCancel} submitLabel={submitLabel} />
    </Elements>
  )
}

function StripeCardForm({
  mode,
  onSuccess,
  onCancel,
  submitLabel,
}: {
  mode: 'payment' | 'setup'
  onSuccess: () => void
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

    const confirmParams = { return_url: window.location.href }
    const { error: confirmError } =
      mode === 'setup'
        ? await stripe.confirmSetup({ elements, redirect: 'if_required', confirmParams })
        : await stripe.confirmPayment({ elements, redirect: 'if_required', confirmParams })

    if (confirmError) {
      setError(
        confirmError.message ||
          'Payment could not be confirmed. Please check your card details and try again.'
      )
      setSubmitting(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
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
          className="flex-1 px-4 py-2.5 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitting ? 'Processing…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
