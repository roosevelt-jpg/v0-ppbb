'use client'

import React, { useEffect, useState } from 'react'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  splitMissionHeadline,
} from '@/lib/homepage-config'

/** Mobile: landscape frame when stacked; desktop: stretches to match text column height */
const MISSION_IMAGE_FRAME =
  'relative w-full h-full min-h-0 overflow-hidden rounded-2xl aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto'

function MissionImage({ imageURL }: { imageURL: string | null }) {
  if (imageURL) {
    return (
      <div className={MISSION_IMAGE_FRAME}>
        <img
          src={imageURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`${MISSION_IMAGE_FRAME} bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center`}
    >
      <p className="text-sm text-muted-foreground font-body px-6 text-center">
        Mission image — upload from Admin → CMS → Homepage
      </p>
    </div>
  )
}

function MissionSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-pulse">
      <div className="max-w-[72rem] mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 lg:items-stretch">
        <div className="space-y-4">
          <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-24 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
        <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl min-h-0" />
      </div>
    </section>
  )
}

export function HomeMission() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = subscribeToHomepage((data) => {
      setConfig(data)
      setReady(true)
    })
    return unsub
  }, [])

  if (!ready) return <MissionSkeleton />

  const { mission } = config
  const headlineParts = splitMissionHeadline(mission.headline, mission.headlineItalicWord)

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-background overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 lg:items-stretch">
        <div className="min-w-0 flex flex-col lg:h-full">
          <p className="eyebrow text-muted-foreground mb-2 break-words">{mission.eyebrow}</p>
          <h2 className="font-headline text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold leading-snug mb-4 text-foreground break-words max-w-[42rem]">
            {headlineParts ? (
              <>
                {headlineParts.before}
                <em className="font-headline italic">{headlineParts.italic}</em>
                {headlineParts.after}
              </>
            ) : (
              mission.headline
            )}
          </h2>
          <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed w-full max-w-[42rem] break-words">
            {mission.body}
          </p>
        </div>

        <div className="min-w-0 w-full flex flex-col lg:h-full lg:min-h-0">
          <MissionImage imageURL={mission.imageURL} />
        </div>
      </div>
    </section>
  )
}
