'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { EventsHero } from '@/components/events/events-hero'
import { EventsFilterTabs } from '@/components/events/events-filter-tabs'
import { EventsCalendar } from '@/components/events/events-calendar'
import { EventsLineup } from '@/components/events/events-lineup'
import { subscribeToPublishedEvents } from '@/lib/event-queries'
import {
  subscribeToEventsConfig,
  DEFAULT_EVENTS_CONFIG,
  buildCategoryFilterTabs,
  EventsPlatformConfig,
} from '@/lib/events-config'
import {
  matchesCategoryFilter,
  isSameMonth,
  getEventStartDate,
  type NormalizedEvent,
} from '@/lib/event-utils'
import { isSameDay } from 'date-fns'

export default function EventsPage() {
  const [config, setConfig] = useState<EventsPlatformConfig>(() => ({
    ...DEFAULT_EVENTS_CONFIG,
    filterTabs: buildCategoryFilterTabs(DEFAULT_EVENTS_CONFIG.categories),
  }))
  const [events, setEvents] = useState<NormalizedEvent[]>([])
  const [configReady, setConfigReady] = useState(false)
  const [eventsReady, setEventsReady] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(
    () =>
      subscribeToEventsConfig((data) => {
        setConfig(data)
        setConfigReady(true)
      }),
    []
  )

  useEffect(
    () =>
      subscribeToPublishedEvents((data) => {
        setEvents(data)
        setEventsReady(true)
      }),
    []
  )

  useEffect(() => {
    const valid = new Set(config.filterTabs.map((t) => t.id))
    if (!valid.has(categoryFilter)) setCategoryFilter('all')
  }, [config.filterTabs, categoryFilter])

  const categoryFilteredEvents = useMemo(
    () => events.filter((event) => matchesCategoryFilter(event, categoryFilter)),
    [events, categoryFilter]
  )

  const monthEvents = useMemo(
    () =>
      categoryFilteredEvents.filter((event) =>
        isSameMonth(getEventStartDate(event), calendarMonth)
      ),
    [categoryFilteredEvents, calendarMonth]
  )

  const lineupEvents = useMemo(() => {
    const base = selectedDate
      ? monthEvents.filter((event) => isSameDay(getEventStartDate(event), selectedDate))
      : monthEvents
    return [...base].sort(
      (a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime()
    )
  }, [monthEvents, selectedDate])

  const loading = !configReady || !eventsReady

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <EventsHero />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 overflow-x-hidden">
        <div className="max-w-[72rem] mx-auto w-full min-w-0 space-y-6 sm:space-y-8">
          {configReady && (
            <EventsFilterTabs
              tabs={config.filterTabs}
              active={categoryFilter}
              onChange={(filter) => {
                setCategoryFilter(filter)
                setSelectedDate(null)
              }}
            />
          )}

          {configReady && (
            <EventsCalendar
              month={calendarMonth}
              onMonthChange={(month) => {
                setCalendarMonth(month)
                setSelectedDate(null)
              }}
              events={categoryFilteredEvents}
              categories={config.categories}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}

          {configReady && (
            <EventsLineup
              month={calendarMonth}
              events={lineupEvents}
              monthCount={monthEvents.length}
              pageConfig={config.pageConfig}
              categories={config.categories}
              loading={loading}
              selectedDate={selectedDate}
            />
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
