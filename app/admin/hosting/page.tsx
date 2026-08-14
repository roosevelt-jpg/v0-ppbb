'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth } from '@/lib/firebase'
import {
  HOSTING_BILLED_TO,
  HOSTING_BILLING_ADDRESS,
  HOSTING_CREDENTIALS_EMAIL,
  HOSTING_LINE_ITEMS,
  HOSTING_MONTHLY_USD,
  HOSTING_PERIOD_LABEL,
  HOSTING_PERIOD_MONTHS,
  HOSTING_PLAN_NAME,
  HOSTING_TOTAL_USD,
  type HostingRecord,
} from '@/lib/hosting-config'
import { ArrowRight, CheckCircle2, Cloud, Lock, Mail, Server } from 'lucide-react'

type HostingApiData = HostingRecord & { stripeConfigured?: boolean }

function AwsCloudLogo({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://d0.awsstatic.com/logos/powered-by-aws.png"
      alt="Powered by AWS Cloud Computing"
      className={className}
      width={160}
      height={60}
    />
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

function formatUsd(amount: number, fractions = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fractions,
    minimumFractionDigits: fractions,
  }).format(amount)
}

function stripeErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message: unknown }).message
    if (typeof m === 'string' && m) return m
  }
  return 'Payment failed'
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

/**
 * Name + card only. Billing entity on the charge is Passive Blessings, Dubai, UAE
 * (UAE Stripe Hosting account).
 */
function HostingPayForm({
  paymentIntentId,
  clientSecret,
  onPaid,
}: {
  paymentIntentId: string
  clientSecret: string
  onPaid: (record: HostingRecord) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardholderName, setCardholderName] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const finalize = async (piId: string) => {
    const res = await adminFetch('/api/admin/hosting/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId: piId }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Could not activate hosting (HTTP ${res.status})`)
    }
    onPaid(json.data as HostingRecord)
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    const name = cardholderName.trim()
    if (!name) {
      setError('Enter the cardholder name')
      return
    }

    const card = elements.getElement(CardElement)
    if (!card) {
      setError('Card field is not ready. Refresh the page and try again.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const email = auth.currentUser?.email?.trim() || HOSTING_CREDENTIALS_EMAIL

      // return_url is required for redirect-based 3DS (common for UAE-issued cards).
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name,
            email,
            address: {
              line1: HOSTING_BILLING_ADDRESS.line1,
              city: HOSTING_BILLING_ADDRESS.city,
              country: HOSTING_BILLING_ADDRESS.country,
            },
          },
        },
        return_url: `${window.location.origin}/admin/hosting`,
      })

      if (result.error) {
        const code = result.error.code || result.error.decline_code || ''
        const msg = result.error.message || 'Payment failed'
        setError(code ? `${msg} (${code})` : msg)
        return
      }

      const status = result.paymentIntent?.status
      if (status === 'requires_action') {
        setError('Complete the bank verification window, then this page will finish payment.')
        return
      }
      if (status && status !== 'succeeded' && status !== 'processing') {
        setError(`Payment incomplete (${status}). Please try again.`)
        return
      }

      await finalize(result.paymentIntent?.id || paymentIntentId)
    } catch (err) {
      setError(stripeErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handlePay(e)} className="space-y-4">
      <p className="text-xs text-neutral-500 leading-relaxed">
        Enter <span className="font-semibold text-neutral-800">cardholder name</span> and{' '}
        <span className="font-semibold text-neutral-800">card details</span> only. Invoice billed to{' '}
        <span className="font-semibold text-neutral-800">{HOSTING_BILLED_TO}</span>.
      </p>

      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-neutral-900">Cardholder name</span>
          <input
            type="text"
            name="cardholderName"
            autoComplete="cc-name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Name on card"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-neutral-900">Card details</span>
          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </label>
      </div>

      {error ? <p className="text-sm text-rose-600 whitespace-pre-wrap">{error}</p> : null}

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full min-h-[48px] rounded-lg bg-[#673de6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5a32d1] disabled:opacity-50"
      >
        {submitting ? 'Processing…' : `Pay ${formatUsd(HOSTING_TOTAL_USD)} · Continue`}
      </button>
    </form>
  )
}

function OrderSummary({
  isActive,
  children,
}: {
  isActive: boolean
  children?: React.ReactNode
}) {
  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm lg:sticky lg:top-6">
      <h2 className="text-lg font-bold text-neutral-900">Order summary</h2>
      <p className="mt-1 text-sm font-semibold text-neutral-800">{HOSTING_PLAN_NAME}</p>

      <ul className="mt-5 space-y-3 text-sm">
        {HOSTING_LINE_ITEMS.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-neutral-800">
                {item.label}
                {item.id === 'ssl' ? ': 1yr' : ''}
              </p>
              {'detail' in item && item.detail ? (
                <p className="text-xs text-neutral-500 mt-0.5">{item.detail}</p>
              ) : null}
            </div>
            <span className="shrink-0 font-semibold text-neutral-900">
              {formatUsd(item.amountUsd)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-neutral-100 pt-4">
        <div className="flex items-end justify-between gap-3">
          <span className="text-base font-bold text-neutral-900">Total</span>
          <span className="text-2xl font-bold text-neutral-900 tracking-tight">
            {formatUsd(HOSTING_TOTAL_USD)}
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          {formatUsd(HOSTING_MONTHLY_USD)}/mo × {HOSTING_PERIOD_MONTHS} months + SSL + storage
        </p>
      </div>

      <div className="mt-4 rounded-lg bg-neutral-50 px-3 py-2.5 text-xs text-neutral-600 space-y-1">
        <p>
          <span className="font-semibold text-neutral-800">Billed to:</span> {HOSTING_BILLED_TO}
        </p>
        <p>
          <span className="font-semibold text-neutral-800">Credentials:</span>{' '}
          {HOSTING_CREDENTIALS_EMAIL}
        </p>
      </div>

      {isActive ? (
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Active
        </div>
      ) : (
        children
      )}
    </aside>
  )
}

export default function AdminHostingPage() {
  const [hosting, setHosting] = React.useState<HostingApiData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = React.useState<string | null>(null)
  const [stripePromise, setStripePromise] = React.useState<Promise<Stripe | null> | null>(null)
  const [preparing, setPreparing] = React.useState(false)
  const [isDesktop, setIsDesktop] = React.useState<boolean | null>(null)
  const returningFrom3ds = React.useRef(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const loadStatus = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/hosting')
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load')
      setHosting(json.data as HostingApiData)
    } catch (err) {
      setError(stripeErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  // After 3DS redirect — confirm before any new PaymentIntent is created
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const pi = params.get('payment_intent')
    const clientSecretFromReturn = params.get('payment_intent_client_secret')
    const redirectStatus = params.get('redirect_status')
    if (!pi && !clientSecretFromReturn) return

    returningFrom3ds.current = true
    let cancelled = false

    const run = async () => {
      try {
        if (redirectStatus && redirectStatus !== 'succeeded' && redirectStatus !== 'processing') {
          setError(
            redirectStatus === 'failed'
              ? 'Bank verification did not complete. Enter name and card and try again.'
              : `Payment was not completed (${redirectStatus}). Try again.`
          )
          window.history.replaceState({}, '', '/admin/hosting')
          returningFrom3ds.current = false
          return
        }

        const id = pi || ''
        if (!id) {
          returningFrom3ds.current = false
          return
        }

        const res = await adminFetch('/api/admin/hosting/confirm', {
          method: 'POST',
          body: JSON.stringify({ paymentIntentId: id }),
        })
        const json = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.ok && json.success) {
          setHosting({ ...(json.data as HostingRecord), stripeConfigured: true })
          setError(null)
        } else {
          setError(json.error || 'Payment could not be confirmed after bank verification')
        }
        window.history.replaceState({}, '', '/admin/hosting')
      } catch {
        if (!cancelled) setError('Payment could not be confirmed after bank verification')
      } finally {
        returningFrom3ds.current = false
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    if (!hosting || hosting.status === 'active' || !hosting.stripeConfigured) return
    if (returningFrom3ds.current) return
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('payment_intent') || params.get('payment_intent_client_secret')) return
    }

    let cancelled = false
    const controller = new AbortController()
    setPreparing(true)

    void adminFetch('/api/admin/hosting/payment-intent', {
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json.success) throw new Error(json.error || 'Could not start payment')
        if (cancelled) return
        const pk = String(json.data.publishableKey || '')
        setClientSecret(String(json.data.clientSecret || ''))
        setPaymentIntentId(String(json.data.paymentIntentId || ''))
        setStripePromise((prev) => prev || loadStripe(pk))
      })
      .catch((err) => {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return
        setError(stripeErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setPreparing(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [hosting?.status, hosting?.stripeConfigured])

  const onPaid = React.useCallback((record: HostingRecord) => {
    setHosting({ ...record, stripeConfigured: true })
    setClientSecret(null)
    setPaymentIntentId(null)
    setError(null)
  }, [])

  const isActive = hosting?.status === 'active'
  const showCheckout = !loading && !isActive && !!hosting?.stripeConfigured

  const checkoutPanel = (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {preparing || !clientSecret || !stripePromise || !paymentIntentId ? (
        !error ? <p className="text-sm text-neutral-500">Preparing secure card payment…</p> : null
      ) : (
        <Elements key={paymentIntentId} stripe={stripePromise}>
          <HostingPayForm
            paymentIntentId={paymentIntentId}
            clientSecret={clientSecret}
            onPaid={onPaid}
          />
        </Elements>
      )}
    </div>
  )

  return (
    <AdminPageLayout title="Hosting">
      <div className="min-h-[70vh] -mx-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Infrastructure</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-neutral-900">
              Cloud hosting checkout
            </h1>
          </div>
          <a
            href="https://aws.amazon.com/what-is-cloud-computing"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-white border border-neutral-200 px-3 py-2 shadow-sm"
          >
            <AwsCloudLogo className="h-10 w-auto object-contain" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-8 items-start">
          <div className="space-y-5">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Server className="h-5 w-5 text-neutral-700" />
                <h2 className="text-lg font-bold text-neutral-900">{HOSTING_PLAN_NAME}</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-600 mb-1.5">Period</p>
                  <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-neutral-900 min-w-[180px]">
                    {HOSTING_PERIOD_LABEL}
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-3xl font-bold text-neutral-900 tracking-tight">
                    {formatUsd(HOSTING_MONTHLY_USD)}
                    <span className="text-base font-semibold text-neutral-500">/mo</span>
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Billed as {formatUsd(HOSTING_MONTHLY_USD * HOSTING_PERIOD_MONTHS)} for{' '}
                    {HOSTING_PERIOD_LABEL}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-[#0b1437] px-4 py-3 text-sm text-white">
                <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Includes <span className="font-semibold">SSL: 1yr</span>, Cloud OS, and storage
                  bucket for Passive Blessings.
                </span>
              </div>

              <div className="mt-4 flex items-start gap-2 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Login credentials will be sent to{' '}
                  <a
                    href={`mailto:${HOSTING_CREDENTIALS_EMAIL}`}
                    className="font-semibold underline underline-offset-2"
                  >
                    {HOSTING_CREDENTIALS_EMAIL}
                  </a>
                  .
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
              <h3 className="text-base font-bold text-neutral-900 mb-3">What&apos;s included</h3>
              <ul className="space-y-3 text-sm text-neutral-700">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Cloud OS</span> — {formatUsd(HOSTING_MONTHLY_USD)}
                    /mo for {HOSTING_PERIOD_LABEL} (
                    {formatUsd(HOSTING_MONTHLY_USD * HOSTING_PERIOD_MONTHS)})
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">SSL: 1yr</span> — {formatUsd(120)}
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Storage bucket</span> — {formatUsd(80)} included
                  </span>
                </li>
              </ul>
            </section>

            {loading ? (
              <p className="text-sm text-neutral-500">Loading hosting status…</p>
            ) : isActive ? (
              <section className="rounded-2xl border-2 border-neutral-900 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="text-lg font-bold">Hosting is Active</h3>
                </div>
                <p className="text-base font-semibold text-neutral-900">
                  Proceed with migrating your files to AWS from your current host.
                </p>
                <ol className="space-y-3 text-sm text-neutral-700">
                  <li className="flex gap-2">
                    <span className="font-bold text-neutral-900">1.</span>
                    Open AWS credentials emailed to {HOSTING_CREDENTIALS_EMAIL}.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-neutral-900">2.</span>
                    Migrate app files, config, and media to AWS.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-neutral-900">3.</span>
                    Enable SSL, update DNS, verify, then retire the old host.
                  </li>
                </ol>
                <div className="flex items-start gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white">
                  <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Credentials are sent to {HOSTING_CREDENTIALS_EMAIL}.</p>
                </div>
                {hosting?.paidAt ? (
                  <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Paid {new Date(hosting.paidAt).toLocaleDateString('en-GB')} ·{' '}
                    {formatUsd(hosting.amountPaidUsd || HOSTING_TOTAL_USD)}
                  </p>
                ) : null}
              </section>
            ) : !hosting?.stripeConfigured ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Add Stripe (Hosting) keys under Admin → Integrations. Publishable and secret
                must both be live or both be test (UAE Stripe account).
              </div>
            ) : isDesktop === false ? (
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
                <h3 className="text-base font-bold text-neutral-900 mb-4">Pay with card</h3>
                {checkoutPanel}
              </section>
            ) : null}
          </div>

          <OrderSummary isActive={!!isActive}>
            {/* Exactly one Elements mount — never both mobile + desktop */}
            {showCheckout && isDesktop === true ? (
              <div className="mt-5">{checkoutPanel}</div>
            ) : null}
            {!isActive ? (
              <p className="mt-4 text-xs text-neutral-500 leading-relaxed">
                After payment, Hosting becomes Active — then migrate your files to AWS.
              </p>
            ) : null}
          </OrderSummary>
        </div>

        {!isActive ? (
          <p className="mt-6 flex items-center gap-2 text-xs text-neutral-400">
            <Cloud className="h-3.5 w-3.5" />
            Powered by Amazon Web Services · Stripe (Hosting) from Integrations
          </p>
        ) : null}
      </div>
    </AdminPageLayout>
  )
}
