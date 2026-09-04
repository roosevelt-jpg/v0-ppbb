'use client'

import React from 'react'
import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
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

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#171717',
      '::placeholder': { color: '#a3a3a3' },
    },
    invalid: { color: '#e11d48' },
  },
  hidePostalCode: true,
} as const

interface StripeCardCheckoutProps {
  publishableKey: string
  clientSecret: string
  /** payment = charge now; setup = save card for trial (no charge yet). */
  mode: 'payment' | 'setup'
  onSuccess: () => void
  onCancel?: () => void
  submitLabel?: string
}

/**
 * Embedded card-only form — CardElement fields only (no Stripe Checkout page,
 * no Payment Element wallets/Link tabs). 3DS may still show a bank challenge modal.
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
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CardOnlyForm
        clientSecret={clientSecret}
        mode={mode}
        onSuccess={onSuccess}
        onCancel={onCancel}
        submitLabel={submitLabel}
      />
    </Elements>
  )
}

function CardOnlyForm({
  clientSecret,
  mode,
  onSuccess,
  onCancel,
  submitLabel,
}: {
  clientSecret: string
  mode: 'payment' | 'setup'
  onSuccess: () => void
  onCancel?: () => void
  submitLabel: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    const cardholderName = name.trim()
    if (!cardholderName) {
      setError('Enter the cardholder name')
      return
    }

    const card = elements.getElement(CardElement)
    if (!card) {
      setError('Card field is not ready. Refresh and try again.')
      return
    }

    setSubmitting(true)
    setError(null)

    const payment_method = {
      card,
      billing_details: { name: cardholderName },
    }

    const { error: confirmError } =
      mode === 'setup'
        ? await stripe.confirmCardSetup(clientSecret, { payment_method })
        : await stripe.confirmCardPayment(clientSecret, { payment_method })

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
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Cardholder name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name on card"
          autoComplete="cc-name"
          className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white text-neutral-900"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Card details</label>
        <div className="rounded-lg border border-neutral-300 bg-white px-3 py-3">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>
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
        Card details are processed securely — no redirect to a branded checkout page.
      </p>
    </form>
  )
}
