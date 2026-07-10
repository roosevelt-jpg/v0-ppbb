'use client'

export const dynamic = 'force-dynamic'
import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CalendarPlus, CheckCircle, Download } from 'lucide-react'

function ConfirmationInner() {
  const searchParams = useSearchParams()
  const params = useParams()
  const registrationId = searchParams.get('registrationId')
  const eventId = params.id as string
  const [reg, setReg] = React.useState<any>(null)

  React.useEffect(() => {
    if (!registrationId) return
    // Load via guests is host-only; store QR from sessionStorage if set during register
    const cached = sessionStorage.getItem(`event-reg-${registrationId}`)
    if (cached) {
      try {
        setReg(JSON.parse(cached))
      } catch {
        /* ignore */
      }
    }
  }, [registrationId])

  const qrValue = reg?.qrToken || reg?.checkInCode || registrationId || ''
  const qrUrl = qrValue
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}`
    : ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 max-w-md w-full text-center space-y-4">
        <CheckCircle size={64} className="mx-auto text-green-600" />
        <h1 className="text-3xl font-bold text-black">
          {reg?.status === 'waitlisted'
            ? "You're on the waitlist"
            : reg?.status === 'pending'
              ? 'Registration pending approval'
              : 'Registration confirmed'}
        </h1>
        <p className="text-gray-600">
          {reg?.status === 'waitlisted'
            ? `Position #${reg.waitlistPosition || '—'}. We'll notify you if a spot opens.`
            : reg?.status === 'pending'
              ? 'The host will review your registration shortly.'
              : 'Show this QR code at the door for check-in.'}
        </p>

        {qrUrl && reg?.status === 'confirmed' && (
          <div className="py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="Check-in QR" className="mx-auto border rounded-lg" />
            {reg?.checkInCode && (
              <p className="mt-2 font-mono text-lg tracking-widest">{reg.checkInCode}</p>
            )}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <a
            href={`/api/events/${eventId}/ics`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-100 text-black rounded-lg font-semibold hover:bg-neutral-200"
          >
            <CalendarPlus size={18} /> Add to calendar (.ics)
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
