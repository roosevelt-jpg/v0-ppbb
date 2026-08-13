'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth } from '@/lib/firebase'
import {
  HOSTING_BILLED_TO,
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

/** Official AWS co-marketing “Powered by AWS” mark (awsstatic CDN). */
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

function OrderSummaryCard({
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
        <p className="text-neutral-500">Additional storage usage billed monthly.</p>
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

function PayWithStripeButton({
  disabled,
  onError,
}: {
  disabled?: boolean
  onError: (message: string) => void
}) {
  const [submitting, setSubmitting] = React.useState(false)

  const handlePay = async () => {
    setSubmitting(true)
    onError('')
    try {
      const res = await adminFetch('/api/admin/hosting/checkout', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success || !json.data?.checkoutUrl) {
        throw new Error(json.error || 'Could not start Stripe checkout')
      }
      window.location.assign(json.data.checkoutUrl as string)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not start payment')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500 leading-relaxed">
        You will enter cardholder name, billing address, and card details on Stripe&apos;s secure
        checkout (best for bank 3D Secure). Invoice remains{' '}
        <span className="font-semibold text-neutral-800">{HOSTING_BILLED_TO}</span>.
      </p>
      <button
        type="button"
        disabled={disabled || submitting}
        onClick={() => void handlePay()}
        className="w-full min-h-[48px] rounded-lg bg-[#673de6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5a32d1] disabled:opacity-50"
      >
        {submitting ? 'Redirecting to Stripe…' : `Pay ${formatUsd(HOSTING_TOTAL_USD)} · Continue`}
      </button>
    </div>
  )
}

export default function AdminHostingPage() {
  const [hosting, setHosting] = React.useState<HostingApiData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)

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

  // Return from Stripe Checkout
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const canceled = params.get('canceled')

    if (canceled) {
      setCheckoutError('Payment was canceled. You can try again when ready.')
      window.history.replaceState({}, '', '/admin/hosting')
      return
    }

    if (!sessionId) return

    let cancelled = false
    setConfirming(true)
    void adminFetch('/api/admin/hosting/confirm', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.success) {
          setHosting({ ...(json.data as HostingRecord), stripeConfigured: true })
          setCheckoutError(null)
        } else {
          setCheckoutError(json.error || 'Payment could not be confirmed after Stripe checkout')
        }
        window.history.replaceState({}, '', '/admin/hosting')
      })
      .catch(() => {
        if (!cancelled) {
          setCheckoutError('Payment could not be confirmed after Stripe checkout')
        }
      })
      .finally(() => {
        if (!cancelled) setConfirming(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const isActive = hosting?.status === 'active'
  const canPay = !loading && !isActive && !!hosting?.stripeConfigured && !confirming

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

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start">
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
                  <p className="mt-2 text-xs text-neutral-500">
                    1-year term · renews with storage billed monthly for usage. Cancel anytime after
                    term.
                  </p>
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
                    <span className="font-semibold">SSL: 1yr</span> — {formatUsd(120)} certificate
                    coverage for the term
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Storage bucket</span> — {formatUsd(80)} included;
                    extra usage billed monthly
                  </span>
                </li>
              </ul>
            </section>

            {loading || confirming ? (
              <p className="text-sm text-neutral-500">
                {confirming ? 'Confirming payment with Stripe…' : 'Loading hosting status…'}
              </p>
            ) : isActive ? (
              <section className="rounded-2xl border-2 border-neutral-900 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="text-lg font-bold">Hosting is Active</h3>
                </div>
                <p className="text-base font-semibold text-neutral-900 leading-snug">
                  Once hosting is Active, proceed with the migration of your files to AWS right from
                  your current host.
                </p>
                <ol className="space-y-3 text-sm text-neutral-700">
                  <li className="flex gap-2">
                    <span className="font-bold text-neutral-900">1.</span>
                    Open AWS credentials emailed to {HOSTING_CREDENTIALS_EMAIL}.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-neutral-900">2.</span>
                    Migrate app files, config, and media from your current host to AWS.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-neutral-900">3.</span>
                    Enable SSL, update DNS, verify the site, then retire the old host.
                  </li>
                </ol>
                <div className="flex items-start gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white">
                  <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    Do not wait for further setup beyond the credentials sent to{' '}
                    {HOSTING_CREDENTIALS_EMAIL}.
                  </p>
                </div>
                {hosting?.paidAt ? (
                  <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Paid {new Date(hosting.paidAt).toLocaleDateString('en-GB')} ·{' '}
                    {formatUsd(hosting.amountPaidUsd || HOSTING_TOTAL_USD)}
                  </p>
                ) : null}
              </section>
            ) : (
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-4 lg:hidden">
                <h3 className="text-base font-bold text-neutral-900">Pay with card</h3>
                {checkoutError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    {checkoutError}
                  </div>
                ) : null}
                {!hosting?.stripeConfigured ? (
                  <p className="text-sm text-amber-800">
                    Configure Stripe (Hosting) under Admin → Integrations first.
                  </p>
                ) : (
                  <PayWithStripeButton
                    disabled={!canPay}
                    onError={(msg) => setCheckoutError(msg || null)}
                  />
                )}
              </section>
            )}
          </div>

          <OrderSummaryCard isActive={!!isActive}>
            {!loading && !isActive ? (
              <div className="mt-5 space-y-3 hidden lg:block">
                {checkoutError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    {checkoutError}
                  </div>
                ) : null}
                {!hosting?.stripeConfigured ? (
                  <p className="text-sm text-amber-800">
                    Configure Stripe (Hosting) under Admin → Integrations first.
                  </p>
                ) : confirming ? (
                  <p className="text-sm text-neutral-500">Confirming payment with Stripe…</p>
                ) : (
                  <PayWithStripeButton
                    disabled={!canPay}
                    onError={(msg) => setCheckoutError(msg || null)}
                  />
                )}
              </div>
            ) : null}
            {!isActive ? (
              <p className="mt-4 text-xs text-neutral-500 leading-relaxed">
                After payment, Hosting becomes Active — then migrate your files to AWS from your
                current host.
              </p>
            ) : null}
          </OrderSummaryCard>
        </div>

        {!isActive ? (
          <p className="mt-6 flex items-center gap-2 text-xs text-neutral-400">
            <Cloud className="h-3.5 w-3.5" />
            Powered by Amazon Web Services · Configure Stripe (Hosting) under Integrations if payment
            is unavailable.
          </p>
        ) : null}
      </div>
    </AdminPageLayout>
  )
}
