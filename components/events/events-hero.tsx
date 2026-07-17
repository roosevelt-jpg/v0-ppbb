'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  subscribeToEventsConfig,
  DEFAULT_EVENTS_CONFIG,
  EventsPlatformConfig,
} from '@/lib/events-config'

export function EventsHero() {
  const [config, setConfig] = useState<EventsPlatformConfig>(DEFAULT_EVENTS_CONFIG)
  const [ready, setReady] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => subscribeToEventsConfig((data) => {
    setConfig(data)
    setReady(true)
  }), [])

  const gallery = (config.pageConfig.heroGalleryURLs || []).filter(Boolean)

  useEffect(() => {
    if (gallery.length < 2) return
    const t = setInterval(() => setSlide((s) => (s + 1) % gallery.length), 4000)
    return () => clearInterval(t)
  }, [gallery.length])

  if (!ready) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-[#f7f6f2] animate-pulse overflow-x-hidden">
        <div className="max-w-[72rem] mx-auto space-y-4">
          <div className="h-3 w-40 bg-neutral-200 rounded" />
          <div className="h-10 w-full max-w-[40rem] bg-neutral-200 rounded" />
          <div className="h-16 w-full max-w-[36rem] bg-neutral-200 rounded" />
        </div>
      </section>
    )
  }

  const { pageConfig } = config

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-[#f7f6f2] overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0 grid md:grid-cols-2 gap-6 md:gap-8 items-center">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground mb-2 break-words">{pageConfig.eyebrow}</p>
          <h1 className="font-headline text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-foreground break-words max-w-[42rem]">
            {pageConfig.headline}
          </h1>
          <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[42rem] break-words mb-6">
            {pageConfig.body}
          </p>
          <Link
            href="/events#lineup"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-900 transition-colors"
          >
            Browse events
          </Link>
        </div>

        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#e4e1da] bg-neutral-100">
          {gallery.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={gallery[slide % gallery.length]}
                src={gallery[slide % gallery.length]}
                alt="Previous Passive Blessings events"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {gallery.length > 1 ? (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setSlide(i)}
                      className={`h-2 w-2 rounded-full ${i === slide % gallery.length ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Add previous event photos in Admin → CMS → Events Config (hero gallery).
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
