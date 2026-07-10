'use client'

import React from 'react'
import { format } from 'date-fns'
import type { EventsPageConfig, EventsCategory } from '@/lib/events-config'
import {
  formatLineupCount,
  formatLineupHeading,
} from '@/lib/events-config'
import type { NormalizedEvent } from '@/lib/event-utils'
import { EventLineupCard } from '@/components/events/event-lineup-card'

interface EventsLineupProps {
  month: Date
  events: NormalizedEvent[]
  monthCount: number
  pageConfig: EventsPageConfig
  categories: EventsCategory[]
  loading: boolean
  selectedDate?: Date | null
}

export function EventsLineup({
  month,
  events,
  monthCount,
  pageConfig,
  categories,
  loading,
  selectedDate,
}: EventsLineupProps) {
  const monthLabel = format(month, 'MMMM')
  const heading = formatLineupHeading(pageConfig.lineupHeadingTemplate, monthLabel)
  const countLabel = formatLineupCount(pageConfig.lineupCountTemplate, monthCount)

  return (
    <section className="min-w-0">
      <div className="mb-4 sm:mb-6">
        <h2 className="font-headline text-2xl sm:text-3xl font-bold text-foreground break-words">
          {heading}
        </h2>
        <p className="font-body text-sm text-muted-foreground mt-1 break-words">{countLabel}</p>
        {selectedDate && (
          <p className="font-body text-xs text-muted-foreground mt-2">
            Showing events for {format(selectedDate, 'EEEE, MMMM d')}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-[#e4e1da] bg-white px-4 py-10 sm:px-6 text-center">
          <p className="font-body text-sm sm:text-base text-muted-foreground break-words">
            {pageConfig.emptyLineupMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {events.map((event) => (
            <EventLineupCard
              key={event.id}
              event={event}
              pageConfig={pageConfig}
              categories={categories}
            />
          ))}
        </div>
      )}
    </section>
  )
}
