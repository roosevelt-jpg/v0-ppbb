'use client'

import React, { useMemo, useState } from 'react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Loader2, Lock } from 'lucide-react'

type StripeCardFormInnerProps = {
  clientSecret: string
  cardholderName?: string
  submitLabel?: string
  onSuccess: (paymentIntentId: string) => void | Promise<void>
  onError?: (message: string) => void
  returnUrl?: string
}

function StripeCardFormInner({
  submitLabel = 'Pay securely',
  onSuccess,
  onError,
  returnUrl,
}: StripeCardFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        const message = submitError.message || 'Payment could not be started'
        setError(message)
        onError?.(message)
        return
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || window.location.href,
        },
        redirect: 'if_required',
      })

      if (result.error) {
        const message = result.error.message || 'Payment failed'
        setError(message)
        onError?.(message)
        return
      }

      const piId = result.paymentIntent?.id
      if (!piId || (result.paymentIntent.status !== 'succeeded' && result.paymentIntent.status !== 'processing')) {
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
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />
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
        Apple Pay, Google Pay, and cards stay on this page. Open the site in Safari on iPhone or Chrome on Android.
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
    <Elements
      stripe={stripePromise as Promise<Stripe | null>}
      options={{ clientSecret: props.clientSecret, locale: 'en' }}
    >
      <StripeCardFormInner {...props} />
    </Elements>
  )
}
