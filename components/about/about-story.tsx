'use client'

import React, { useEffect, useState } from 'react'
import { subscribeToAbout, DEFAULT_ABOUT, AboutConfig } from '@/lib/about-config'

/** Portrait frame at every breakpoint — never switches to landscape on desktop */
const FOUNDER_IMAGE_FRAME =
  'relative w-full overflow-hidden rounded-2xl aspect-[3/4] bg-neutral-100'

const FOUNDER_IMAGE_COLUMN =
  'min-w-0 w-full max-w-[14rem] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-[22rem] mx-auto lg:mx-0 order-1'

export function AboutStory() {
  const [config, setConfig] = useState<AboutConfig>(DEFAULT_ABOUT)
  const [ready, setReady] = useState(false)

  useEffect(() => subscribeToAbout((data) => {
    setConfig(data)
    setReady(true)
  }), [])

  if (!ready) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-pulse overflow-x-hidden">
        <div className="max-w-[72rem] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start">
          <div className={`${FOUNDER_IMAGE_COLUMN} aspect-[3/4] bg-neutral-200 rounded-2xl`} />
          <div className="space-y-4 order-2">
            <div className="h-3 w-28 bg-neutral-200 rounded" />
            <div className="h-24 w-full bg-neutral-200 rounded" />
          </div>
        </div>
      </section>
    )
  }

  const { story } = config

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-background overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 lg:items-start">
        <div className={FOUNDER_IMAGE_COLUMN}>
          <div className={FOUNDER_IMAGE_FRAME}>
            {story.founderImageURL ? (
              <img
                src={story.founderImageURL}
                alt={story.founderImageAlt}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center border border-neutral-200">
                <p className="text-sm text-muted-foreground px-6 text-center">
                  Founder image — upload from Admin → CMS → About
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex flex-col lg:h-full order-2">
          <p className="eyebrow text-muted-foreground mb-2 break-words">{story.eyebrow}</p>
          <div className="space-y-4 mb-6">
            {story.paragraphs.map((para, i) => (
              <p
                key={i}
                className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed break-words"
              >
                {para}
              </p>
            ))}
          </div>
          {story.pullQuote && (
            <blockquote className="border-l-4 border-black pl-4 mt-auto">
              <p className="font-headline text-lg sm:text-xl italic text-foreground break-words leading-snug">
                {story.pullQuote}
              </p>
            </blockquote>
          )}
        </div>
      </div>
    </section>
  )
}
