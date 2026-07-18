'use client'

export const dynamic = 'force-dynamic'
import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { auth } from '@/lib/firebase'
import { CalendarPlus, CheckCircle, Clock, Download } from 'lucide-react'

type RegView = {
  status?: string
  waitlistPosition?: number | null
  checkInCode?: string | null
  qrToken?: string | null
  paymentStatus?: string | null
}

function ConfirmationInner() {
  const searchParams = useSearchParams()
  const params = useParams()
  const registrationId = searchParams.get('registrationId')
  const eventId = params.id as string
  const [reg, setReg] = React.useState<RegView | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!registrationId) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      // Prefer live registration so we never show a stale "pending approval" from cache
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
          setLoading(false)
          return
        }
      } catch {
        /* fall through to cache */
      }

      const cached = sessionStorage.getItem(`event-reg-${registrationId}`)
      if (!cancelled && cached) {
        try {
          setReg(JSON.parse(cached))
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [registrationId])

  const status = String(reg?.status || 'confirmed')
  const isPendingApproval = status === 'pending'
  const isWaitlisted = status === 'waitlisted'
  const isConfirmed = status === 'confirmed'

  const qrValue = reg?.qrToken || reg?.checkInCode || ''
  const qrUrl =
    qrValue && isConfirmed
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}`
      : ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 max-w-md w-full text-center space-y-4">
        {loading ? (
          <p className="text-neutral-500 text-sm">Loading registration…</p>
        ) : (
          <>
            {isPendingApproval ? (
              <Clock size={64} className="mx-auto text-amber-600" />
            ) : (
              <CheckCircle size={64} className="mx-auto text-green-600" />
            )}
            <h1 className="text-3xl font-bold text-black">
              {isWaitlisted
                ? "You're on the waitlist"
                : isPendingApproval
                  ? 'Registration pending approval'
                  : 'Registration confirmed'}
            </h1>
            <p className="text-gray-600">
              {isWaitlisted
                ? `Position #${reg?.waitlistPosition || '—'}. We'll notify you if a spot opens.`
                : isPendingApproval
                  ? 'The host will review your registration shortly. You will get a QR code after approval.'
                  : 'Show this QR code at the door for check-in.'}
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

            <div className="space-y-3 pt-2">
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
              <Link
                href={`/events/${eventId}`}
                className="block w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900"
              >
                Back to Event
              </Link>
              <Link
                href="/dashboard/events"
                className="block w-full py-3 border border-gray-200 text-black rounded-lg font-semibold hover:bg-gray-50"
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
