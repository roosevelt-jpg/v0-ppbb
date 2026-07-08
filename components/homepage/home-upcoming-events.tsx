'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { collection, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
} from '@/lib/homepage-config'
import EventCard from '@/components/event-card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar } from 'lucide-react'
import type { Event } from '@/lib/types'

function EventsSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 bg-gradient-to-b from-white to-[#f7f6f2] animate-pulse overflow-x-hidden">
      <div className="max-w-[80rem] mx-auto w-full min-w-0">
        <div className="h-8 w-56 bg-neutral-200 rounded mb-3" />
        <div className="h-4 w-80 bg-neutral-200 rounded mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 bg-neutral-200 rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  )
}

function toEventDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  const parsed = new Date(value as string)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function HomeUpcomingEvents() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [events, setEvents] = useState<Event[]>([])
  const [configReady, setConfigReady] = useState(false)
  const [eventsReady, setEventsReady] = useState(false)

  useEffect(() => subscribeToHomepage((data) => {
    setConfig(data)
    setConfigReady(true)
  }), [])

  useEffect(() => {
    const maxFetch = Math.max(config.eventsSection.maxEventsToShow, 8)
    const eventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'published'),
      orderBy('date', 'asc'),
      limit(maxFetch)
    )

    const unsub = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const mapped = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data()
            const date = toEventDate(data.date)
            return {
              id: docSnap.id,
              ...data,
              date: date || new Date(),
            } as Event
          })
          .filter((event) => {
            const eventDate = toEventDate(event.date)
            return eventDate ? eventDate >= now : true
          })
        setEvents(mapped)
        setEventsReady(true)
      },
      () => {
        setEvents([])
        setEventsReady(true)
      }
    )

    return unsub
  }, [config.eventsSection.maxEventsToShow])

  const displayEvents = useMemo(
    () => events.slice(0, config.eventsSection.maxEventsToShow),
    [events, config.eventsSection.maxEventsToShow]
  )

  if (!configReady || !eventsReady) return <EventsSkeleton />

  const { eventsSection } = config

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 bg-gradient-to-b from-white to-[#f7f6f2] overflow-x-hidden">
      <div className="max-w-[80rem] mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6 md:mb-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#111111] flex-shrink-0" />
              <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold break-words">
                {eventsSection.heading}
              </h2>
            </div>
            <p className="font-body text-xs sm:text-sm text-[#888888] mt-1 break-words">
              {eventsSection.subheading}
            </p>
          </div>
          <Link href={eventsSection.ctaHref} className="flex-shrink-0">
            <Button
              size="sm"
              className="w-full sm:w-auto bg-[#111111] hover:bg-[#333333] text-white min-h-[44px]"
            >
              {eventsSection.ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {displayEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-[#e4e1da] mx-auto mb-4" />
            <p className="font-body text-base sm:text-lg text-[#888888] font-medium break-words">
              Events coming soon. Check back shortly.
            </p>
          </div>
        )}

        {displayEvents.length >= 4 && (
          <div className="text-center mt-6 sm:mt-7">
            <Link href={eventsSection.ctaHref}>
              <Button
                variant="outline"
                className="bg-white border-[#111111] text-[#111111] hover:bg-[#f7f6f2] min-h-[44px]"
              >
                {eventsSection.ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
