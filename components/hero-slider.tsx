'use client'

import React, { useEffect, useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { HeroSliderSettings } from '@/lib/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HeroSliderProps {
  settings: HeroSliderSettings | null
}

export function HeroSlider({ settings }: HeroSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    duration: settings?.transitionDuration || 500,
  })
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedIndex())
  }, [emblaApi])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!settings?.autoplay || !emblaApi) return

    const timer = setInterval(() => {
      emblaApi.scrollNext()
    }, (settings.autoplayDuration || 5) * 1000)

    return () => clearInterval(timer)
  }, [emblaApi, settings])

  if (!settings || !settings.images || settings.images.length === 0) {
    return (
      <div className="w-full h-96 bg-neutral-100 rounded-2xl flex items-center justify-center">
        <p className="text-neutral-500">No slides available</p>
      </div>
    )
  }

  const images = settings.images.filter(img => img.isActive).sort((a, b) => a.displayOrder - b.displayOrder)

  if (images.length === 0) {
    return (
      <div className="w-full h-96 bg-neutral-100 rounded-2xl flex items-center justify-center">
        <p className="text-neutral-500">No active slides</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden">
      {/* Carousel Container */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {images.map(image => (
            <div
              key={image.id}
              className="flex-[0_0_100%] min-w-0 relative h-96 md:h-[500px] lg:h-[600px]"
            >
              {/* Image Container with proper aspect ratio handling.
                  A blurred, scaled copy fills the frame as a backdrop, while
                  the foreground image is shown in full via object-contain so
                  it is never stretched, cropped, or distorted regardless of
                  the source aspect ratio. */}
              <div className="w-full h-full bg-black overflow-hidden relative">
                <img
                  src={image.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="absolute inset-0 w-full h-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 lg:p-12">
                {image.title && (
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                    {image.title}
                  </h2>
                )}
                {image.subtitle && (
                  <p className="text-lg md:text-xl text-white/90 mb-6">
                    {image.subtitle}
                  </p>
                )}
                {image.link && (
                  <a
                    href={image.link}
                    className="w-fit px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    Learn More
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
        <button
          onClick={scrollPrev}
          className="pointer-events-auto bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={scrollNext}
          className="pointer-events-auto bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 pointer-events-none">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`pointer-events-auto h-2 rounded-full transition-all ${
              index === selectedIndex
                ? 'bg-white w-8'
                : 'bg-white/40 w-2 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
