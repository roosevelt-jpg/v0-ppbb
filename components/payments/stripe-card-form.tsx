'use client'

import React, { useMemo, useState } from 'react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { Loader2, Lock } from 'lucide-react'

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

type StripeCardFormInnerProps = {
  clientSecret: string
  cardholderName?: string
  submitLabel?: string
  onSuccess: (paymentIntentId: string) => void | Promise<void>
  onError?: (message: string) => void
  returnUrl?: string
}

function StripeCardFormInner({
  clientSecret,
  cardholderName: initialName = '',
  submitLabel = 'Pay securely',
  onSuccess,
  onError,
  returnUrl,
}: StripeCardFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = useState(initialName)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { name: cardholderName },
        },
        ...(returnUrl ? { return_url: returnUrl } : {}),
      })

      if (result.error) {
        const message = result.error.message || 'Payment failed'
        setError(message)
        onError?.(message)
        return
      }

      const piId = result.paymentIntent?.id
      if (!piId || result.paymentIntent.status !== 'succeeded') {
        const message = 'Payment was not completed. Please try again.'
        setError(message)
        onError?.(message)
        return
      }

      await onSuccess(piId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
    }
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
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-neutral-900 text-white disabled:opacity-60"
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
      <p className="text-xs text-neutral-500 text-center flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" />
        Card details are processed securely — no redirect to Stripe.
      </p>
    </form>
  )
}

export type StripeCardFormProps = StripeCardFormInnerProps & {
  publishableKey: string
}

export function StripeCardForm({ publishableKey, ...props }: StripeCardFormProps) {
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  )

  if (!stripePromise) {
    return <p className="text-sm text-red-600">Stripe is not configured.</p>
  }

  return (
    <Elements stripe={stripePromise as Promise<Stripe | null>} options={{ clientSecret: props.clientSecret }}>
      <StripeCardFormInner {...props} />
    </Elements>
  )
}
