'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format } from 'date-fns'
import { getEventLocationLabel, isMapsOrWebUrl } from '@/lib/event-utils'

function toEventDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const date = (value as { toDate: () => Date }).toDate()
      return Number.isNaN(date.getTime()) ? null : date
    } catch {
      return null
    }
  }
  const parsed = new Date(value as string)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

type ListedEvent = {
  id: string
  title: string
  date: Date
  location: string
  score: number
}

function distributionScore(data: Record<string, unknown>): number {
  const text = `${data.title || ''} ${data.category || ''} ${data.description || ''}`.toLowerCase()
  let score = 0
  if (/distribution/.test(text)) score += 5
  if (/weekly|thursday|meal|food|ration/.test(text)) score += 2
  return score
}

export function HomeWeeklyDistribution() {
  const [event, setEvent] = useState<ListedEvent | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'), where('status', '==', 'published'))
    return onSnapshot(
      eventsQuery,
      (snapshot) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const upcoming = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>
            const date = toEventDate(data.startDate) || toEventDate(data.date)
            if (!date || date < today) return null
            const labeled = getEventLocationLabel({
              locationName: typeof data.locationName === 'string' ? data.locationName : '',
              locationAddress: typeof data.locationAddress === 'string' ? data.locationAddress : '',
              location: typeof data.location === 'string' ? data.location : '',
            })
            const area = [data.locationCity, data.locationEmirate, data.locationCountry]
              .map((part) => (typeof part === 'string' ? part.trim() : ''))
              .filter((part) => part && !isMapsOrWebUrl(part))
              .join(', ')
            const location = labeled !== 'Location TBA' ? labeled : area
            return {
              id: docSnap.id,
              title: String(data.title || 'Weekly distribution'),
              date,
              location,
              score: distributionScore(data),
            }
          })
          .filter((item): item is ListedEvent => item !== null)
          .sort((a, b) => b.score - a.score || a.date.getTime() - b.date.getTime())
        setEvent(upcoming[0] || null)
        setReady(true)
      },
      () => setReady(true)
    )
  }, [])

  const registerHref = event ? `/events/${event.id}?intent=register` : '/signup'
  const checkInHref = event ? `/events/${event.id}?intent=checkin` : '/login?returnUrl=%2Fevents'

  return (
    <section className="w-full bg-[#111111] text-white">
      <div className="max-w-[72rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
          Weekly distribution
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold font-headline">
          {ready && event ? event.title : 'Register and check in'}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-neutral-300 max-w-2xl">
          {event
            ? `${format(event.date, 'EEEE d MMMM yyyy')}${event.location ? ` · ${event.location}` : ''}. Members who tap Register are signed up immediately and emailed a check-in QR code.`
            : 'Create a free individual or business account. No payment. Then register for the distribution and check in.'}
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Link
            href={registerHref}
            className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-lg bg-white text-neutral-900 text-sm font-semibold"
          >
            Register
          </Link>
          <Link
            href={checkInHref}
            className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-lg border border-white text-white text-sm font-semibold"
          >
            Check in
          </Link>
        </div>
      </div>
    </section>
  )
}
