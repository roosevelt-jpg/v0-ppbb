'use client'

export const dynamic = 'force-dynamic'
import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { StripeCardForm } from '@/components/payments/stripe-card-form'
import { Card } from '@/components/ui/card'
import { auth } from '@/lib/firebase'
import { CalendarPlus, CheckCircle, Clock, Download, ExternalLink, MessageCircle } from 'lucide-react'

type RegView = {
  status?: string
  waitlistPosition?: number | null
  checkInCode?: string | null
  qrToken?: string | null
  paymentStatus?: string | null
  paymentGateway?: string | null
  eventId?: string
  userId?: string
  hostPaymentLink?: string | null
  hostWhatsapp?: string | null
  ticketPrice?: number | null
  currency?: string | null
}

function ConfirmationInner() {
  const searchParams = useSearchParams()
  const params = useParams()
  const registrationId = searchParams.get('registrationId')
  const eventId = params.id as string
  const [reg, setReg] = React.useState<RegView | null>(null)
  const [eventTitle, setEventTitle] = React.useState('this event')
  const [loading, setLoading] = React.useState(true)
  const [paying, setPaying] = React.useState(false)
  const [payError, setPayError] = React.useState<string | null>(null)
  const [couponCode, setCouponCode] = React.useState('')
  const [stripeCheckout, setStripeCheckout] = React.useState<{
    clientSecret: string
    publishableKey: string
    registrationId: string
  } | null>(null)

  React.useEffect(() => {
    if (!registrationId) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const token = await auth.currentUser?.getIdToken().catch(() => null)
        const res = await fetch(
          `/api/events/register?registrationId=${encodeURIComponent(registrationId)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache: 'no-store',
          }
        )
        const json = await res.json()
        if (!cancelled && json.success && json.registration) {
          setReg(json.registration)
          sessionStorage.setItem(
            `event-reg-${registrationId}`,
            JSON.stringify(json.registration)
          )
        }
      } catch {
        const cached = sessionStorage.getItem(`event-reg-${registrationId}`)
        if (!cancelled && cached) {
          try {
            setReg(JSON.parse(cached))
          } catch {
            /* ignore */
          }
        }
      }

      try {
        const ev = await fetch(`/api/events/${eventId}?publishedOnly=true`)
        const evJson = await ev.json()
        if (!cancelled && evJson.success && evJson.data?.title) {
          setEventTitle(String(evJson.data.title))
          // Fill host payment fields from event if registration snapshot is missing them
          setReg((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              hostPaymentLink: prev.hostPaymentLink || evJson.data.hostPaymentLink || null,
              hostWhatsapp: prev.hostWhatsapp || evJson.data.hostWhatsapp || null,
            }
          })
        }
      } catch {
        /* ignore */
      }

      if (!cancelled) setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [registrationId, eventId])

  const status = String(reg?.status || '')
  const paymentStatus = String(reg?.paymentStatus || '')
  const isPendingApproval = status === 'pending'
  const isWaitlisted = status === 'waitlisted'
  const isHostCollect =
    paymentStatus === 'pending_host' || String(reg?.paymentGateway || '') === 'host_direct'
  const isPendingPbPayment =
    !isHostCollect &&
    (status === 'pending_payment' ||
      (paymentStatus === 'pending' && status !== 'confirmed' && status !== 'waitlisted'))
  const isPendingPayment = isPendingPbPayment || isHostCollect
  const isConfirmed =
    status === 'confirmed' && (paymentStatus === 'paid' || paymentStatus === 'free' || !paymentStatus)

  const qrValue = reg?.qrToken || reg?.checkInCode || ''
  const qrUrl =
    qrValue && isConfirmed
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}`
      : ''

  const whatsappHref = React.useMemo(() => {
    const digits = String(reg?.hostWhatsapp || '').replace(/[^\d]/g, '')
    if (!digits) return null
    const amount =
      reg?.ticketPrice != null && Number(reg.ticketPrice) > 0
        ? ` (${String(reg.currency || 'AED').toUpperCase()} ${Number(reg.ticketPrice).toFixed(2)})`
        : ''
    const text = encodeURIComponent(
      `Assalamu alaikum — I registered for "${eventTitle}" on Passive Blessings and have paid${amount}. Please confirm my attendance. Registration: ${registrationId || ''}`
    )
    return `https://api.whatsapp.com/send?phone=${digits}&text=${text}`
  }, [reg?.hostWhatsapp, reg?.ticketPrice, reg?.currency, eventTitle, registrationId])

  const handlePayNow = async () => {
    if (!registrationId) return
    setPaying(true)
    setPayError(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      const user = auth.currentUser
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          eventId,
          userId: user?.uid,
          userEmail: user?.email || '',
          userName: user?.displayName || '',
          couponCode: couponCode.trim() || undefined,
          registrationType: 'paid',
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setPayError(json.error || 'Could not start payment')
        return
      }
      if (json.embedded && json.clientSecret && json.publishableKey) {
        setStripeCheckout({
          clientSecret: json.clientSecret,
          publishableKey: json.publishableKey,
          registrationId: json.registrationId || registrationId,
        })
        return
      }
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl
        return
      }
      setPayError('Payment could not be started. Return to the event and try again.')
    } catch (err) {
      console.error('[confirmation] pay now', err)
      setPayError('Payment failed to start')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      {stripeCheckout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-lg font-semibold mb-2">Pay for your ticket</h2>
            <p className="text-xs text-neutral-600 mb-3">
              Payment is required during registration. You are confirmed only after the card
              payment succeeds.
            </p>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Coupon / unlock code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Optional"
                  className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg"
                />
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => void handlePayNow()}
                  className="px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
            <StripeCardForm
              key={stripeCheckout.clientSecret}
              publishableKey={stripeCheckout.publishableKey}
              clientSecret={stripeCheckout.clientSecret}
              submitLabel="Pay & confirm"
              onSuccess={async (paymentIntentId) => {
                const res = await fetch('/api/payments/confirm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'event_ticket',
                    paymentIntentId,
                    registrationId: stripeCheckout.registrationId,
                  }),
                })
                const confirmJson = await res.json()
                if (!res.ok || !confirmJson.success) {
                  setPayError(confirmJson.error || 'Payment confirmation failed')
                  return
                }
                window.location.href =
                  confirmJson.confirmationUrl ||
                  `/events/${eventId}/confirmation?registrationId=${stripeCheckout.registrationId}`
              }}
              onError={(msg) => setPayError(msg)}
            />
            <button
              type="button"
              className="mt-3 text-xs underline text-neutral-600"
              onClick={() => setStripeCheckout(null)}
            >
              Cancel
            </button>
          </Card>
        </div>
      ) : null}
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 max-w-md w-full text-center space-y-4">
        {loading ? (
          <p className="text-neutral-500 text-sm">Loading registration…</p>
        ) : (
          <>
            {isPendingApproval || isPendingPayment ? (
              <Clock size={64} className="mx-auto text-amber-600" />
            ) : (
              <CheckCircle size={64} className="mx-auto text-green-600" />
            )}
            <h1 className="text-3xl font-bold text-black">
              {isWaitlisted
                ? "You're on the waitlist"
                : isPendingApproval
                  ? 'Registration pending approval'
                  : isHostCollect
                    ? 'Pay the host, then message WhatsApp'
                    : isPendingPbPayment
                      ? 'Complete payment to confirm'
                      : isConfirmed
                        ? 'Registration confirmed'
                        : 'Registration received'}
            </h1>
            <p className="text-gray-600 text-sm">
              {isWaitlisted
                ? `Position #${reg?.waitlistPosition || '—'}. We'll notify you if a spot opens.`
                : isPendingApproval
                  ? 'The host will review your registration shortly.'
                  : isHostCollect
                    ? 'Passive Blessings does not collect this ticket fee. Pay the host, tell them on WhatsApp that you paid, then wait for them to confirm your attendance.'
                    : isPendingPbPayment
                      ? 'Pay now during registration. Your check-in QR appears only after payment succeeds.'
                      : isConfirmed
                        ? 'Show this QR code at the door for check-in.'
                        : 'We received your registration.'}
            </p>

            {qrUrl ? (
              <div className="py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="Check-in QR" className="mx-auto border rounded-lg" />
                {reg?.checkInCode ? (
                  <p className="mt-2 font-mono text-lg tracking-widest">{reg.checkInCode}</p>
                ) : null}
              </div>
            ) : null}

            {payError ? <p className="text-sm text-red-600">{payError}</p> : null}

            <div className="space-y-3 pt-2 text-left">
              {isHostCollect ? (
                <>
                  {reg?.hostPaymentLink ? (
                    <a
                      href={reg.hostPaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-neutral-800"
                    >
                      <ExternalLink size={18} /> 1. Open payment link
                    </a>
                  ) : null}
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-800"
                    >
                      <MessageCircle size={18} /> 2. WhatsApp: I paid
                    </a>
                  ) : null}
                  <p className="text-xs text-neutral-600 text-center">
                    3. Host confirms your attendance in their Guests list — then you get a
                    confirmation.
                  </p>
                </>
              ) : null}

              {isPendingPbPayment ? (
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => void handlePayNow()}
                  className="w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-neutral-800 disabled:opacity-50"
                >
                  {paying ? 'Opening payment…' : 'Pay now'}
                </button>
              ) : null}

              {!isPendingPayment && (
                <>
                  <a
                    href={`/api/events/${eventId}/google-calendar`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-neutral-800"
                  >
                    <CalendarPlus size={18} /> Add to Google Calendar
                  </a>
                  <a
                    href={`/api/events/${eventId}/ics`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-100 text-black rounded-lg font-semibold hover:bg-neutral-200"
                  >
                    <Download size={18} /> Download .ics
                  </a>
                </>
              )}
              <Link
                href={`/events/${eventId}`}
                className="block w-full py-3 border border-gray-200 text-black rounded-lg font-semibold hover:bg-gray-50 text-center"
              >
                Back to Event
              </Link>
              <Link
                href="/dashboard/events"
                className="block w-full py-3 border border-gray-200 text-black rounded-lg font-semibold hover:bg-gray-50 text-center"
              >
                My Events
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center">Loading…</div>}>
        <ConfirmationInner />
      </Suspense>
      <Footer />
    </>
  )
}
