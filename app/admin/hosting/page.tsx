'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth } from '@/lib/firebase'
import {
  HOSTING_BILLED_TO,
  HOSTING_CREDENTIALS_EMAIL,
  HOSTING_LINE_ITEMS,
  HOSTING_TOTAL_USD,
  type HostingRecord,
} from '@/lib/hosting-config'
import { CheckCircle2, Cloud, Mail, Server, ArrowRight } from 'lucide-react'

type HostingApiData = HostingRecord & { stripeConfigured?: boolean }

function AwsLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 304 182"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Amazon Web Services"
    >
      <title>AWS</title>
      <path
        fill="#232F3E"
        d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.9 4.2 3.5 6.1 1.1 1.2 2.3 2.1 3.4 2.7l-.1.4c-1.6-.1-3.4-.6-5.3-1.5-1.9-.9-3.5-2-4.8-3.3-2.8-2.9-4.5-6.5-5.2-10.8-.7-4.3-.5-8.9.7-13.8 1.2-4.9 3.4-9.3 6.6-13.1 3.2-3.8 7.2-6.7 12-8.7 4.8-2 9.9-2.7 15.3-2.1 3.5.4 6.5 1.3 9 2.8 2.5 1.5 4.4 3.6 5.7 6.3 1.3 2.7 1.9 5.9 1.9 9.6v5.1H86.4zm39.6-8.1c0-3.2-.7-5.8-2.1-7.8-1.4-2-3.6-3.2-6.6-3.6-2.5-.3-5 .2-7.4 1.5-2.4 1.3-4.5 3.2-6.2 5.7-1.7 2.5-3 5.4-3.8 8.6-.8 3.2-1.1 6.4-.8 9.5h26.9v-13.9z"
      />
      <path
        fill="#232F3E"
        d="M152.8 40.2c4.1 0 7.6.8 10.5 2.4 2.9 1.6 5.1 3.8 6.7 6.6 1.6 2.8 2.4 5.9 2.4 9.4 0 3.7-.9 7-2.6 9.9-1.7 2.9-4.1 5.2-7.1 6.9-3 1.7-6.5 2.5-10.4 2.5-2.1 0-4.1-.3-5.9-.9-1.8-.6-3.4-1.4-4.8-2.5v21.4h-12.6V41.7h11.7l.6 4.2c1.4-1.6 3.1-2.8 5.1-3.7 2-.9 4.2-1.4 6.4-1.4zm-2.8 10.1c-1.9 0-3.5.5-4.9 1.4-1.4.9-2.5 2.2-3.2 3.8-.7 1.6-1.1 3.4-1.1 5.4 0 2 .4 3.7 1.1 5.2.7 1.5 1.8 2.7 3.2 3.5 1.4.8 3 1.2 4.8 1.2 1.9 0 3.5-.5 4.8-1.4 1.3-.9 2.3-2.2 3-3.8.7-1.6 1-3.4 1-5.3 0-2-.3-3.7-1-5.2-.7-1.5-1.7-2.7-3-3.5-1.3-.8-2.9-1.3-4.7-1.3z"
      />
      <path
        fill="#232F3E"
        d="M196.2 40.2c2.3 0 4.3.3 6.1.9 1.8.6 3.3 1.5 4.5 2.7l-3.9 8.2c-.9-.8-1.9-1.4-3.1-1.8-1.2-.4-2.4-.6-3.7-.6-1.9 0-3.5.5-4.8 1.4-1.3.9-2.3 2.3-2.9 4-.6 1.7-.9 3.7-.9 5.9 0 2.3.3 4.3.9 5.9.6 1.6 1.6 2.9 2.9 3.8 1.3.9 2.9 1.3 4.8 1.3 1.4 0 2.7-.2 4-.7 1.3-.5 2.4-1.2 3.4-2.1l3.9 8c-1.4 1.3-3.1 2.3-5.1 3-2 .7-4.3 1.1-6.9 1.1-4.1 0-7.6-.8-10.6-2.5-3-1.7-5.3-4-6.9-6.9-1.6-2.9-2.4-6.2-2.4-9.9 0-3.6.8-6.8 2.4-9.6 1.6-2.8 3.8-5 6.7-6.6 2.9-1.6 6.3-2.4 10.2-2.4z"
      />
      <path
        fill="#232F3E"
        d="M232.6 66.5c-1.1 0-2 .1-2.8.4-.8.3-1.4.7-1.9 1.3-.5.6-.7 1.3-.7 2.2 0 .8.2 1.5.7 2 .5.5 1.1.9 1.9 1.1.8.2 1.6.3 2.5.3 1.2 0 2.3-.2 3.3-.5 1-.3 1.8-.8 2.5-1.4v-5.1c-.7.5-1.5.9-2.5 1.2-1 .2-2 .5-3 .5zm15.1-26.3v38.7c0 4.1-.8 7.5-2.4 10.2-1.6 2.7-3.8 4.7-6.6 6-2.8 1.3-6 1.9-9.6 1.9-2.7 0-5.2-.4-7.4-1.1-2.2-.7-4-1.8-5.4-3.1l3.8-8.3c1.1 1 2.4 1.7 3.9 2.2 1.5.5 3 .7 4.5.7 2.3 0 4.1-.6 5.3-1.7 1.2-1.1 1.8-2.9 1.8-5.3v-3.6c-1.3 1.2-2.9 2.2-4.8 2.9-1.9.7-4 1.1-6.3 1.1-3.3 0-6.2-.7-8.6-2.1-2.4-1.4-4.3-3.4-5.6-5.9-1.3-2.5-2-5.5-2-8.8 0-3.4.7-6.4 2.1-9 1.4-2.6 3.4-4.7 5.9-6.2 2.5-1.5 5.5-2.2 8.8-2.2 2.4 0 4.5.4 6.4 1.2 1.9.8 3.5 1.9 4.8 3.3l.6-3.6h11.2zm-12.4 21.5c-.8-.9-1.8-1.5-3.1-2-1.3-.5-2.6-.7-3.9-.7-1.7 0-3.1.4-4.3 1.2-1.2.8-2.1 1.9-2.7 3.3-.6 1.4-.9 2.9-.9 4.6 0 1.7.3 3.2.9 4.5.6 1.3 1.5 2.3 2.7 3 1.2.7 2.6 1.1 4.2 1.1 1.4 0 2.8-.3 4-.9 1.2-.6 2.2-1.4 3-2.5.8-1.1 1.2-2.4 1.2-3.9v-4.5c0-1.2-.4-2.3-1.1-3.2z"
      />
      <path
        fill="#232F3E"
        d="M277.6 39.5c3.2 0 5.9.5 8.2 1.6 2.3 1.1 4.1 2.6 5.3 4.6 1.2 2 1.8 4.4 1.8 7.1v28.6h-12.6v-4.1c-1.3 1.6-3 2.9-5.1 3.8-2.1.9-4.5 1.4-7.1 1.4-2.9 0-5.4-.5-7.6-1.6-2.2-1.1-3.8-2.6-5-4.6-1.2-2-1.8-4.3-1.8-7 0-2.9.7-5.3 2.1-7.2 1.4-1.9 3.3-3.4 5.7-4.4 2.4-1 5.1-1.5 8.1-1.5 2.1 0 4 .3 5.7.9 1.7.6 3.1 1.4 4.2 2.5v-2.3c0-1.5-.5-2.7-1.5-3.6-1-.9-2.4-1.4-4.2-1.4-1.5 0-2.9.3-4.2.8-1.3.5-2.4 1.2-3.3 2l-4.5-7.5c1.5-1.1 3.3-2 5.4-2.6 2.1-.7 4.4-1.1 6.9-1.1zm-3.4 34.3c1.3 0 2.5-.3 3.6-.8 1.1-.5 2-1.3 2.6-2.3.6-1 .9-2.2.9-3.5v-3.8c-.9-.9-2-1.6-3.3-2.1-1.3-.5-2.6-.7-4-.7-1.6 0-2.9.3-3.9 1-1 .7-1.5 1.7-1.5 3.1 0 1.4.5 2.4 1.6 3.1 1.1.7 2.5 1 4 1z"
      />
      <path
        fill="#FF9900"
        d="M273.5 143.6c-32.8 24.2-80.5 37.1-121.5 37.1-57.5 0-109.3-21.3-148.4-56.7-3.1-2.8-.3-6.6 3.4-4.4 42.4 24.7 94.8 39.5 148.9 39.5 36.5 0 76.7-7.6 113.7-23.3 5.6-2.4 10.3 3.7 3.9 7.8z"
      />
      <path
        fill="#FF9900"
        d="M287.1 128.1c-4.2-5.4-27.8-2.5-38.4-1.3-3.2.4-3.7-2.4-.8-4.4 18.7-13.2 49.5-9.4 53.1-5 3.6 4.4-1 35.1-18.5 49.7-2.7 2.2-5.3 1-3.8-1.9 4.8-9.7 15.6-31.4 8.4-37.1z"
      />
    </svg>
  )
}

async function adminFetch(path: string, options?: RequestInit) {
  const token = await auth.currentUser?.getIdToken()
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  })
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function HostingCheckoutForm({
  paymentIntentId,
  onPaid,
}: {
  paymentIntentId: string
  onPaid: (record: HostingRecord) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/admin/hosting?paid=1`,
        },
      })
      if (result.error) {
        setError(result.error.message || 'Payment failed')
        return
      }
      const res = await adminFetch('/api/admin/hosting/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Could not activate hosting after payment')
      }
      onPaid(json.data as HostingRecord)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handlePay(e)} className="space-y-4">
      <div className="rounded-lg border border-[#e4e1da] bg-white p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card'],
          }}
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full min-h-[44px] rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {submitting ? 'Processing…' : `Pay ${formatUsd(HOSTING_TOTAL_USD)} for hosting`}
      </button>
    </form>
  )
}

export default function AdminHostingPage() {
  const [hosting, setHosting] = React.useState<HostingApiData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null)
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = React.useState<string | null>(null)
  const [stripePromise, setStripePromise] = React.useState<Promise<Stripe | null> | null>(null)
  const [preparing, setPreparing] = React.useState(false)

  const loadStatus = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/hosting')
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load')
      setHosting(json.data as HostingApiData)
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Failed to load hosting')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  // After Stripe redirect (3DS), confirm and activate hosting.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const pi =
      params.get('payment_intent') ||
      (params.get('paid') === '1' ? params.get('payment_intent') : null)
    if (!pi) return

    let cancelled = false
    void adminFetch('/api/admin/hosting/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId: pi }),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!cancelled && res.ok && json.success) {
          setHosting({ ...(json.data as HostingRecord), stripeConfigured: true })
          window.history.replaceState({}, '', '/admin/hosting')
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    if (!hosting || hosting.status === 'active' || !hosting.stripeConfigured) return
    if (clientSecret) return

    let cancelled = false
    setPreparing(true)
    setCheckoutError(null)

    void adminFetch('/api/admin/hosting/payment-intent', { method: 'POST' })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Could not start payment')
        if (cancelled) return
        setClientSecret(json.data.clientSecret)
        setPaymentIntentId(json.data.paymentIntentId)
        setStripePromise(loadStripe(json.data.publishableKey))
      })
      .catch((err) => {
        if (!cancelled) {
          setCheckoutError(err instanceof Error ? err.message : 'Could not start payment')
        }
      })
      .finally(() => {
        if (!cancelled) setPreparing(false)
      })

    return () => {
      cancelled = true
    }
  }, [hosting, clientSecret])

  const isActive = hosting?.status === 'active'

  return (
    <AdminPageLayout title="Hosting">
      <div className="space-y-6 max-w-3xl">
        <div className="rounded-xl border border-[#e4e1da] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Infrastructure
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Cloud Hosting</h1>
              <p className="mt-2 text-sm text-neutral-600">
                Platform hosting for Passive Blessings on Amazon Web Services.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <AwsLogo className="h-12 w-auto max-w-[160px]" />
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5" />}
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 text-sm text-neutral-700 space-y-1">
            <p>
              <span className="font-semibold text-neutral-900">Billed to:</span> {HOSTING_BILLED_TO}
            </p>
            <p>
              <span className="font-semibold text-neutral-900">Login credentials will be sent to:</span>{' '}
              <a
                href={`mailto:${HOSTING_CREDENTIALS_EMAIL}`}
                className="underline underline-offset-2 text-neutral-900 hover:text-neutral-700"
              >
                {HOSTING_CREDENTIALS_EMAIL}
              </a>
            </p>
            <p className="text-neutral-500">
              Additional cost will be billed monthly for storage used.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e4e1da] bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-4 w-4 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-900">Hosting breakdown</h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {HOSTING_LINE_ITEMS.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-neutral-700">{item.label}</span>
                <span className="font-semibold text-neutral-900">{formatUsd(item.amountUsd)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between py-3 text-base">
              <span className="font-bold text-neutral-900">Total</span>
              <span className="font-bold text-neutral-900">{formatUsd(HOSTING_TOTAL_USD)}</span>
            </li>
          </ul>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading hosting status…</p>
        ) : isActive ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-emerald-900">Hosting is Active</h2>
                  <p className="mt-1 text-sm text-emerald-800">
                    Cloud hosting has been paid and is active for Passive Blessings.
                  </p>
                  <dl className="mt-4 grid gap-2 text-sm text-emerald-900/90">
                    <div className="flex justify-between gap-4">
                      <dt>Amount paid</dt>
                      <dd className="font-semibold">
                        {formatUsd(hosting?.amountPaidUsd || HOSTING_TOTAL_USD)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Billed to</dt>
                      <dd className="font-semibold text-right">
                        {hosting?.billedTo || HOSTING_BILLED_TO}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Credentials sent to</dt>
                      <dd className="font-semibold text-right">{HOSTING_CREDENTIALS_EMAIL}</dd>
                    </div>
                    {hosting?.paidAt ? (
                      <div className="flex justify-between gap-4">
                        <dt>Paid on</dt>
                        <dd className="font-semibold">
                          {new Date(hosting.paidAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-neutral-900 bg-white p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Next step
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-snug">
                Hosting is Active — proceed with migrating your files to AWS from your current host.
              </h2>
              <p className="mt-3 text-sm text-neutral-600">
                Your Cloud OS, SSL, and storage bucket are ready. Move the Passive Blessings
                application and media from the current host onto this AWS environment now.
              </p>

              <ol className="mt-6 space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900">Open the AWS login email</p>
                    <p className="mt-0.5 text-sm text-neutral-600">
                      Check{' '}
                      <a
                        href={`mailto:${HOSTING_CREDENTIALS_EMAIL}`}
                        className="underline underline-offset-2"
                      >
                        {HOSTING_CREDENTIALS_EMAIL}
                      </a>{' '}
                      for console access credentials, then sign in to AWS.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900">Migrate from your current host</p>
                    <p className="mt-0.5 text-sm text-neutral-600">
                      Export or sync your app code, environment config, and uploaded files from the
                      current host, then deploy them onto the new AWS Cloud OS and storage bucket.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900">Attach SSL and go live</p>
                    <p className="mt-0.5 text-sm text-neutral-600">
                      Point your domain DNS to AWS, enable the included SSL certificate, verify the
                      site loads, then retire the previous host when you are satisfied.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="mt-6 flex items-start gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white">
                <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold">Clear instruction:</span> once Hosting shows{' '}
                  <span className="font-semibold">Active</span>, proceed with the migration of your
                  files to AWS right from your current host. Do not wait for further setup beyond
                  the credentials emailed to {HOSTING_CREDENTIALS_EMAIL}.
                </p>
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                <Mail className="h-3.5 w-3.5" />
                Questions about access? Contact {HOSTING_CREDENTIALS_EMAIL}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#e4e1da] bg-white p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Pay for hosting</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Enter card details to pay the total hosting amount of {formatUsd(HOSTING_TOTAL_USD)}.
                After payment, Hosting becomes Active — then migrate your files to AWS from your
                current host. Credentials go to {HOSTING_CREDENTIALS_EMAIL}.
              </p>
            </div>

            {checkoutError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {checkoutError}
              </div>
            ) : null}

            {preparing || !clientSecret || !stripePromise || !paymentIntentId ? (
              !checkoutError ? (
                <p className="text-sm text-neutral-500">Preparing secure card payment…</p>
              ) : null
            ) : (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#111111',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <HostingCheckoutForm
                  paymentIntentId={paymentIntentId}
                  onPaid={(record) => {
                    setHosting({ ...record, stripeConfigured: true })
                    setClientSecret(null)
                    setPaymentIntentId(null)
                  }}
                />
              </Elements>
            )}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
