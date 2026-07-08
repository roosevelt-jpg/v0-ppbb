'use client'

import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
} from '@/lib/homepage-config'
import { subscribeToActiveTestimonials, Testimonial } from '@/lib/testimonials'

function TestimonialsSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 animate-pulse overflow-x-hidden">
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
      <div className="bg-white rounded-xl border border-[#e4e1da] overflow-hidden min-w-0">
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
    <blockquote className="bg-white rounded-xl border border-[#e4e1da] p-6 sm:p-8 min-w-0 h-full flex flex-col">
      <Quote className="h-6 w-6 text-neutral-300 mb-4 flex-shrink-0" />
      <p className="font-body text-sm sm:text-base text-[#333333] italic leading-relaxed mb-6 flex-1 break-words">
        {item.quote}
      </p>
      <footer className="flex items-center gap-3">
        {item.avatarURL ? (
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

  useEffect(() => subscribeToHomepage((data) => {
    setConfig(data)
    setConfigReady(true)
  }), [])

  useEffect(() => subscribeToActiveTestimonials((items) => {
    setTestimonials(items)
    setItemsReady(true)
    setIndex(0)
  }), [])

  if (!configReady || !itemsReady) return <TestimonialsSkeleton />

  if (testimonials.length === 0) return null

  const current = testimonials[index]
  const canPrev = index > 0
  const canNext = index < testimonials.length - 1

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 break-words">
          {config.testimonials.heading}
        </h2>

        <div className="relative min-w-0">
          <div className="sm:px-12 md:px-14">
            <TestimonialSlide item={current} />
          </div>

          {testimonials.length > 1 && (
            <>
              <div className="flex sm:hidden justify-center gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={!canPrev}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white border border-[#e4e1da] shadow disabled:opacity-40"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(testimonials.length - 1, i + 1))}
                  disabled={!canNext}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white border border-[#e4e1da] shadow disabled:opacity-40"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={!canPrev}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white border border-[#e4e1da] shadow disabled:opacity-40"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(testimonials.length - 1, i + 1))}
                disabled={!canNext}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white border border-[#e4e1da] shadow disabled:opacity-40"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {testimonials.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center`}
                aria-label={`Go to testimonial ${i + 1}`}
              >
                <span
                  className={`block h-2 w-2 rounded-full transition-colors ${
                    i === index ? 'bg-black' : 'bg-neutral-300'
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
