'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  subscribeToEventsConfig,
  DEFAULT_EVENTS_CONFIG,
  EventsPlatformConfig,
} from '@/lib/events-config'

type Props = {
  /** Used when CMS hero gallery is empty — previous event photos */
  fallbackGalleryURLs?: string[]
}

export function EventsHero({ fallbackGalleryURLs = [] }: Props) {
  const [config, setConfig] = useState<EventsPlatformConfig>(DEFAULT_EVENTS_CONFIG)
  const [ready, setReady] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(
    () =>
      subscribeToEventsConfig((data) => {
        setConfig(data)
        setReady(true)
      }),
    []
  )

  const cmsGallery = (config.pageConfig.heroGalleryURLs || []).filter(Boolean)
  const gallery = cmsGallery.length > 0 ? cmsGallery : fallbackGalleryURLs.filter(Boolean)

  useEffect(() => {
    if (gallery.length < 2) return
    const t = setInterval(() => setSlide((s) => (s + 1) % gallery.length), 4500)
    return () => clearInterval(t)
  }, [gallery.length])

  useEffect(() => {
    setSlide(0)
  }, [gallery.join('|')])

  if (!ready) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-[#f7f6f2] animate-pulse overflow-x-hidden">
        <div className="max-w-[72rem] mx-auto grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-3 w-40 bg-neutral-200 rounded" />
            <div className="h-10 w-full max-w-[40rem] bg-neutral-200 rounded" />
            <div className="h-16 w-full max-w-[36rem] bg-neutral-200 rounded" />
          </div>
          <div className="aspect-[4/3] bg-neutral-200 rounded-lg" />
        </div>
      </section>
    )
  }

  const { pageConfig } = config
  const whatsappHref = (pageConfig.whatsappLink || '').trim()
  const ctaLabel = pageConfig.whatsappButtonLabel || 'Join our WhatsApp Channel'

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-[#f7f6f2] overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0 grid md:grid-cols-2 gap-6 md:gap-10 items-center">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground mb-2 break-words">{pageConfig.eyebrow}</p>
          <h1 className="font-headline text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-foreground break-words max-w-[42rem]">
            {pageConfig.headline}
          </h1>
          <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[42rem] break-words mb-6">
            {pageConfig.body}
          </p>
          <div className="flex flex-wrap gap-3">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-900 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {ctaLabel}
              </a>
            ) : (
              <Link
                href="/events#lineup"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-900 transition-colors"
              >
                Browse events
              </Link>
            )}
          </div>
        </div>

        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#e4e1da] bg-neutral-100 shadow-sm">
          {gallery.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={gallery[slide % gallery.length]}
                src={gallery[slide % gallery.length]}
                alt="Previous Passive Blessings events"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
              <p className="absolute bottom-10 left-3 right-3 text-xs font-semibold uppercase tracking-wide text-white/90">
                Previous events
              </p>
              {gallery.length > 1 ? (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setSlide(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === slide % gallery.length ? 'bg-white' : 'bg-white/45'
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Previous event photos appear here. Upload them in Admin → CMS → Volunteer &amp; Ads
              (Events gallery).
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
