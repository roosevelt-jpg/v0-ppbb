'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { EventsHero } from '@/components/events/events-hero'
import { EventsFilterTabs } from '@/components/events/events-filter-tabs'
import { EventsCalendar } from '@/components/events/events-calendar'
import { EventsLineup } from '@/components/events/events-lineup'
import { EventsVolunteerBanner } from '@/components/events/events-volunteer-banner'
import { subscribeToPublishedEvents } from '@/lib/event-queries'
import {
  subscribeToEventsConfig,
  DEFAULT_EVENTS_CONFIG,
  buildCategoryFilterTabs,
  EventsPlatformConfig,
} from '@/lib/events-config'
import { subscribeToVolunteerConfig } from '@/lib/volunteer-config'
import {
  matchesCategoryFilter,
  isSameMonth,
  getEventStartDate,
  type NormalizedEvent,
} from '@/lib/event-utils'
import { isSameDay, startOfMonth, endOfMonth } from 'date-fns'

type TimeScope = 'upcoming' | 'month'
type PriceFilter = 'all' | 'free' | 'paid'

export default function EventsPage() {
  const [config, setConfig] = useState<EventsPlatformConfig>(() => ({
    ...DEFAULT_EVENTS_CONFIG,
    filterTabs: buildCategoryFilterTabs(DEFAULT_EVENTS_CONFIG.categories),
  }))
  const [volunteerHref, setVolunteerHref] = useState(
    DEFAULT_EVENTS_CONFIG.pageConfig.volunteerBannerHref || '/forms/volunteer-unpaid-service'
  )
  const [events, setEvents] = useState<NormalizedEvent[]>([])
  const [configReady, setConfigReady] = useState(false)
  const [eventsReady, setEventsReady] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [timeScope, setTimeScope] = useState<TimeScope>('upcoming')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(
    () =>
      subscribeToEventsConfig((data) => {
        setConfig(data)
        setConfigReady(true)
        if (data.pageConfig.volunteerBannerHref) {
          setVolunteerHref(data.pageConfig.volunteerBannerHref)
        }
      }),
    []
  )

  useEffect(
    () =>
      subscribeToVolunteerConfig((data) => {
        const link = (data.pageConfig.formLink || '').trim()
        // Prefer PB form path when volunteer CMS still has only an external tinyurl
        if (link.startsWith('/') || link.includes('/forms/')) {
          setVolunteerHref(link)
        } else if (!config.pageConfig.volunteerBannerHref) {
          setVolunteerHref('/forms/volunteer-unpaid-service')
        }
      }),
    [config.pageConfig.volunteerBannerHref]
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

  const categoryFilteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (!matchesCategoryFilter(event, categoryFilter)) return false
      if (priceFilter === 'all') return true
      const tickets = Array.isArray(event.ticketTypes) ? event.ticketTypes : []
      const ticketPrice = tickets.find((t) => t.isActive !== false)?.price
      const price =
        typeof ticketPrice === 'number'
          ? ticketPrice
          : typeof event.price === 'number'
            ? event.price
            : 0
      const isFree =
        event.pricingType === 'free' || price <= 0
      return priceFilter === 'free' ? isFree : !isFree
    })
  }, [events, categoryFilter, priceFilter])

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

  const fallbackGallery = useMemo(() => {
    const urls: string[] = []
    for (const e of events) {
      if (Array.isArray(e.galleryURLs)) {
        for (const u of e.galleryURLs) {
          if (typeof u === 'string' && u.trim()) urls.push(u.trim())
        }
      }
      if (typeof e.bannerURL === 'string' && e.bannerURL.trim()) urls.push(e.bannerURL.trim())
    }
    return [...new Set(urls)].slice(0, 12)
  }, [events])

  const loading = !configReady || !eventsReady
  const pc = config.pageConfig

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <EventsHero fallbackGalleryURLs={fallbackGallery} />

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

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div
                className="inline-flex rounded-lg border border-neutral-300 bg-white p-1 w-full sm:w-auto"
                role="group"
                aria-label="List events by time"
              >
                <button
                  type="button"
                  onClick={() => {
                    setTimeScope('upcoming')
                    setSelectedDate(null)
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    timeScope === 'upcoming'
                      ? 'bg-black text-white'
                      : 'bg-transparent text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Upcoming events
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeScope('month')
                    setSelectedDate(null)
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    timeScope === 'month'
                      ? 'bg-black text-white'
                      : 'bg-transparent text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Per month
                </button>
              </div>

              {timeScope === 'month' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => {
                      setCalendarMonth((m) => {
                        const next = new Date(m)
                        next.setMonth(next.getMonth() - 1)
                        return next
                      })
                      setSelectedDate(null)
                    }}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white text-sm font-semibold hover:bg-neutral-50"
                  >
                    ‹
                  </button>
                  <p className="min-w-[9.5rem] text-center text-sm font-semibold text-neutral-900">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => {
                      setCalendarMonth((m) => {
                        const next = new Date(m)
                        next.setMonth(next.getMonth() + 1)
                        return next
                      })
                      setSelectedDate(null)
                    }}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white text-sm font-semibold hover:bg-neutral-50"
                  >
                    ›
                  </button>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Showing events from today onward</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'All prices'],
                  ['free', 'Free'],
                  ['paid', 'Paid'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPriceFilter(id)}
                  className={`pb-compact-btn px-4 py-2 rounded-lg text-sm font-semibold border ${
                    priceFilter === id
                      ? 'bg-black !text-white border-black'
                      : 'bg-white text-black border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar + volunteer advertising banner (always side-by-side on desktop) */}
          <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
            <div className="min-w-0">
              {configReady ? (
                <EventsCalendar
                  month={calendarMonth}
                  onMonthChange={(month) => {
                    setCalendarMonth(month)
                    setSelectedDate(null)
                    setTimeScope('month')
                  }}
                  events={categoryFilteredEvents}
                  categories={config.categories}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => {
                    setSelectedDate(d)
                    setTimeScope('month')
                  }}
                />
              ) : (
                <div className="h-72 animate-pulse rounded-lg bg-neutral-100" />
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-4">
              <EventsVolunteerBanner
                imageURL={pc.volunteerBannerImageURL || undefined}
                href={volunteerHref || '/forms/volunteer-unpaid-service'}
                alt={pc.volunteerBannerAlt || 'Become a volunteer'}
              />

              {pc.adBannerImageURL ? (
                <a
                  href={pc.adBannerHref || '#'}
                  className="block rounded-lg overflow-hidden border border-[#e4e1da]"
                  target={pc.adBannerHref?.startsWith('http') ? '_blank' : undefined}
                  rel={pc.adBannerHref?.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pc.adBannerImageURL}
                    alt={pc.adBannerAlt || 'Advertisement'}
                    className="w-full object-cover"
                  />
                </a>
              ) : null}
            </aside>
          </div>

          <div id="lineup" className="min-w-0">
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
        </div>
      </section>

      <Footer />
    </div>
  )
}
