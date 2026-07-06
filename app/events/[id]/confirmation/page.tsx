'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { useSearchParams, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CheckCircle } from 'lucide-react'

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const params = useParams()
  const registrationId = searchParams.get('registrationId')
  const eventId = params.id as string

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg border border-gray-200 p-12 max-w-md text-center">
          <CheckCircle size={64} className="mx-auto text-green-600 mb-6" />
          <h1 className="text-3xl font-bold text-black mb-2">Registration Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for registering. A confirmation email has been sent to your inbox with all the event details.
          </p>
          <div className="space-y-3">
            <Link
              href={`/events/${eventId}`}
              className="block w-full py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900"
            >
              Back to Event
            </Link>
            <Link
              href="/dashboard/events"
              className="block w-full py-3 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200"
            >
              My Events
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
