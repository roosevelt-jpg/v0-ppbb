'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
import { isSameDay, startOfMonth, endOfMonth } from 'date-fns'

type TimeScope = 'upcoming' | 'month'

export default function EventsPage() {
  const [config, setConfig] = useState<EventsPlatformConfig>(() => ({
    ...DEFAULT_EVENTS_CONFIG,
    filterTabs: buildCategoryFilterTabs(DEFAULT_EVENTS_CONFIG.categories),
  }))
  const [events, setEvents] = useState<NormalizedEvent[]>([])
  const [configReady, setConfigReady] = useState(false)
  const [eventsReady, setEventsReady] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [timeScope, setTimeScope] = useState<TimeScope>('upcoming')
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

  const scopedEvents = useMemo(() => {
    const now = Date.now()
    if (timeScope === 'upcoming') {
      return categoryFilteredEvents
        .filter((e) => getEventStartDate(e).getTime() >= now - 60 * 60 * 1000)
        .sort((a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime())
    }
    const start = startOfMonth(calendarMonth).getTime()
    const end = endOfMonth(calendarMonth).getTime()
    return categoryFilteredEvents
      .filter((e) => {
        const t = getEventStartDate(e).getTime()
        return t >= start && t <= end
      })
      .sort((a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime())
  }, [categoryFilteredEvents, timeScope, calendarMonth])

  const monthEvents = useMemo(
    () =>
      categoryFilteredEvents.filter((event) =>
        isSameMonth(getEventStartDate(event), calendarMonth)
      ),
    [categoryFilteredEvents, calendarMonth]
  )

  const lineupEvents = useMemo(() => {
    if (timeScope === 'upcoming') {
      return selectedDate
        ? scopedEvents.filter((event) => isSameDay(getEventStartDate(event), selectedDate))
        : scopedEvents
    }
    const base = selectedDate
      ? monthEvents.filter((event) => isSameDay(getEventStartDate(event), selectedDate))
      : monthEvents
    return [...base].sort(
      (a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime()
    )
  }, [timeScope, scopedEvents, monthEvents, selectedDate])

  const loading = !configReady || !eventsReady
  const pc = config.pageConfig

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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setTimeScope('upcoming')
                setSelectedDate(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                timeScope === 'upcoming' ? 'bg-black text-white' : 'bg-white border border-gray-300'
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeScope('month')
                setSelectedDate(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                timeScope === 'month' ? 'bg-black text-white' : 'bg-white border border-gray-300'
              }`}
            >
              This month
            </button>
          </div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
            <div className="space-y-6 min-w-0">
              {configReady && timeScope === 'month' && (
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
                  monthCount={timeScope === 'upcoming' ? lineupEvents.length : monthEvents.length}
                  pageConfig={{
                    ...pc,
                    lineupHeadingTemplate:
                      timeScope === 'upcoming' ? 'UPCOMING EVENTS' : pc.lineupHeadingTemplate,
                    lineupCountTemplate:
                      timeScope === 'upcoming'
                        ? '{count} upcoming events'
                        : pc.lineupCountTemplate,
                  }}
                  categories={config.categories}
                  loading={loading}
                  selectedDate={selectedDate}
                />
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-4">
              {(pc.volunteerBannerImageURL || true) && (
                <a
                  href={pc.volunteerBannerHref || '/forms/volunteer-with-pb'}
                  className="block rounded-lg overflow-hidden border border-[#e4e1da] bg-[#f7f6f2] hover:opacity-95"
                >
                  {pc.volunteerBannerImageURL ? (
                    <img
                      src={pc.volunteerBannerImageURL}
                      alt={pc.volunteerBannerAlt || 'Volunteer'}
                      className="w-full object-cover"
                    />
                  ) : (
                    <div className="p-5 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Volunteer
                      </p>
                      <p className="font-headline text-xl font-bold">Give your time</p>
                      <p className="text-sm text-muted-foreground">
                        Join charity events and volunteer roles across the community.
                      </p>
                      <span className="inline-flex mt-2 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded">
                        Volunteer form →
                      </span>
                    </div>
                  )}
                </a>
              )}

              {pc.adBannerImageURL ? (
                <a
                  href={pc.adBannerHref || '#'}
                  className="block rounded-lg overflow-hidden border border-[#e4e1da]"
                  target={pc.adBannerHref?.startsWith('http') ? '_blank' : undefined}
                  rel={pc.adBannerHref?.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <img
                    src={pc.adBannerImageURL}
                    alt={pc.adBannerAlt || 'Advertisement'}
                    className="w-full object-cover"
                  />
                </a>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
