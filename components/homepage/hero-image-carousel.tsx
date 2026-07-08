'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HeroImage, HeroSlider, splitImageCaption } from '@/lib/homepage-config'

/**
 * Mobile: portrait 4:5 frame when stacked above copy.
 * Desktop (lg+): stretches to match the text column height via grid items-stretch.
 */
const FRAME_CLASS =
  'relative w-full h-full min-h-0 overflow-hidden rounded-2xl bg-neutral-100 aspect-[4/5] lg:aspect-auto'

function HeroCaption({ caption }: { caption: string }) {
  if (!caption.trim()) return null
  const parts = splitImageCaption(caption)
  return (
    <p className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3 text-xs sm:text-sm break-words bg-gradient-to-t from-black/70 via-black/40 to-transparent">
      <span className="eyebrow text-[0.65rem] sm:text-xs text-white/90">{parts.prefix}</span>
      {parts.italic && (
        <>
          {' '}
          <em className="font-headline text-sm sm:text-base text-white">{parts.italic}</em>
        </>
      )}
    </p>
  )
}

export function HeroImageCarousel({
  images,
  slider,
}: {
  images: HeroImage[]
  slider: HeroSlider
}) {
  const [index, setIndex] = useState(0)
  const multi = images.length > 1
  const current = images[index] ?? images[0]

  const goTo = useCallback(
    (next: number) => {
      if (!multi) return
      setIndex((next + images.length) % images.length)
    },
    [images.length, multi]
  )

  const imageKey = images.map((img) => img.id).join('|')

  useEffect(() => {
    setIndex(0)
  }, [imageKey])

  useEffect(() => {
    if (!slider.autoplay || !multi) return
    const ms = Math.max(2, slider.speedSeconds) * 1000
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, ms)
    return () => clearInterval(timer)
  }, [slider.autoplay, slider.speedSeconds, multi, images.length])

  if (images.length === 0) {
    return (
      <div className={`${FRAME_CLASS} flex items-center justify-center border border-neutral-200`}>
        <p className="text-sm text-muted-foreground font-body px-6 text-center">
          Hero images — upload from Admin → CMS → Homepage
        </p>
      </div>
    )
  }

  const durationMs = Math.max(2, slider.speedSeconds) * 200

  if (!multi) {
    return (
      <div className={FRAME_CLASS}>
        <img
          src={current.imageURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <HeroCaption caption={current.caption || ''} />
      </div>
    )
  }

  return (
    <div className={FRAME_CLASS}>
      {slider.transition === 'fade' ? (
        images.map((img, i) => (
          <img
            key={img.id}
            src={img.imageURL}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
            style={{
              opacity: i === index ? 1 : 0,
              transitionDuration: `${durationMs}ms`,
              zIndex: i === index ? 1 : 0,
            }}
          />
        ))
      ) : (
        <div
          className="absolute inset-0 flex transition-transform ease-in-out"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transitionDuration: `${durationMs}ms`,
          }}
        >
          {images.map((img) => (
            <img
              key={img.id}
              src={img.imageURL}
              alt=""
              className="min-w-full h-full object-cover flex-shrink-0"
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-1.5">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => goTo(i)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span
              className={`block rounded-full transition-all ${
                i === index ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          </button>
        ))}
      </div>

      <HeroCaption caption={current.caption || ''} />
    </div>
  )
}
