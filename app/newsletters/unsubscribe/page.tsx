'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!email || !token) {
      setStatus('invalid')
      setMessage('This unsubscribe link is invalid or incomplete.')
      return
    }

    fetch(`/api/newsletters/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage(data.message || 'You have been unsubscribed.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Could not process your request.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again later.')
      })
  }, [email, token])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-lg p-8 shadow-sm text-center">
        <h1
          className="font-headline text-2xl md:text-3xl font-bold text-neutral-900 mb-4"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Newsletter Preferences
        </h1>

        {status === 'loading' && (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-neutral-200 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto" />
          </div>
        )}

        {status === 'success' && (
          <>
            <p className="text-neutral-700 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              {message}
            </p>
            <p className="text-sm text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
              You will no longer receive bulk newsletter emails from Passive Blessings.
            </p>
          </>
        )}

        {(status === 'error' || status === 'invalid') && (
          <p className="text-neutral-700 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            {message}
          </p>
        )}

        <Link
          href="/"
          className="inline-block mt-8 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Return to Passive Blessings
        </Link>
      </div>
    </div>
  )
}

export default function NewsletterUnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="animate-pulse h-8 w-48 bg-neutral-200 rounded" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  )
}
