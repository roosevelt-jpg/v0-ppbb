'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Quote } from 'lucide-react'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
} from '@/lib/homepage-config'
import { subscribeToActiveTestimonials, Testimonial } from '@/lib/testimonials'

const AUTOPLAY_MS = 6000
const SLIDE_MS = 450

function TestimonialsSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 animate-pulse overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <div className="h-10 w-64 bg-neutral-200 rounded mx-auto mb-10" />
        <div className="h-48 bg-neutral-200 rounded-xl" />
      </div>
    </section>
  )
}

function TestimonialSlide({ item }: { item: Testimonial }) {
  if (item.type === 'video' && item.videoURL) {
    return (
      <div className="bg-white rounded-xl border border-[#e4e1da] overflow-hidden min-w-0 h-full">
        <video
          src={item.videoURL}
          controls
          className="w-full aspect-video bg-black"
          playsInline
        />
        <div className="p-4 sm:p-5">
          <p className="font-bold text-sm sm:text-base break-words">{item.name}</p>
          {item.role && (
            <p className="text-xs sm:text-sm text-muted-foreground break-words">{item.role}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <blockquote className="bg-white rounded-xl border border-[#e4e1da] p-5 sm:p-6 min-w-0 h-full flex flex-col">
      <Quote className="h-6 w-6 text-neutral-300 mb-4 flex-shrink-0" />
      <p className="font-body text-sm sm:text-base text-[#333333] italic leading-relaxed mb-6 flex-1 break-words">
        {item.quote}
      </p>
      <footer className="flex items-center gap-3">
        {item.avatarURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.avatarURL}
            alt=""
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm break-words">{item.name}</p>
          {item.role && (
            <p className="text-xs text-muted-foreground break-words">{item.role}</p>
          )}
        </div>
      </footer>
    </blockquote>
  )
}

export function HomeTestimonials() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [configReady, setConfigReady] = useState(false)
  const [itemsReady, setItemsReady] = useState(false)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => subscribeToHomepage((data) => {
    setConfig(data)
    setConfigReady(true)
  }), [])

  useEffect(() => subscribeToActiveTestimonials((items) => {
    setTestimonials(items)
    setItemsReady(true)
    setIndex(0)
  }), [])

  const multi = testimonials.length > 1

  const goTo = useCallback(
    (next: number) => {
      if (!multi) return
      setIndex(((next % testimonials.length) + testimonials.length) % testimonials.length)
    },
    [multi, testimonials.length]
  )

  useEffect(() => {
    if (!multi || paused) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [multi, paused, testimonials.length])

  if (!configReady || !itemsReady) return <TestimonialsSkeleton />

  if (testimonials.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-5 sm:mb-6 md:mb-7 break-words">
          {config.testimonials.heading}
        </h2>

        <div
          className="relative min-w-0 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null
            setPaused(true)
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current
            touchStartX.current = null
            setPaused(false)
            if (start == null || !multi) return
            const end = e.changedTouches[0]?.clientX
            if (end == null) return
            const delta = end - start
            if (Math.abs(delta) < 40) return
            goTo(index + (delta < 0 ? 1 : -1))
          }}
        >
          <div
            className="flex ease-in-out"
            style={{
              transform: `translateX(-${index * 100}%)`,
              transition: `transform ${SLIDE_MS}ms ease-in-out`,
            }}
          >
            {testimonials.map((item) => (
              <div key={item.id} className="min-w-full w-full flex-shrink-0 px-0.5">
                <TestimonialSlide item={item} />
              </div>
            ))}
          </div>
        </div>

        {multi && (
          <div
            className="flex justify-center items-center gap-1.5 mt-4"
            role="tablist"
            aria-label="Success stories"
          >
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => goTo(i)}
                className="pb-compact-btn inline-flex items-center justify-center h-4 w-4 min-h-0 min-w-0 p-0 rounded-full !bg-transparent hover:!bg-transparent shadow-none border-0"
                aria-label={`Go to testimonial ${i + 1}`}
              >
                <span
                  className={`block rounded-full transition-all ${
                    i === index ? 'h-1.5 w-1.5 bg-black' : 'h-1 w-1 bg-neutral-300'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
