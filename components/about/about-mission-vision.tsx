'use client'

import React, { useEffect, useState } from 'react'
import { subscribeToAbout, DEFAULT_ABOUT, AboutConfig } from '@/lib/about-config'

/** Mobile: landscape frame when stacked; desktop: stretches to match text column height */
const MISSION_VISION_IMAGE_FRAME =
  'relative w-full h-full min-h-0 overflow-hidden rounded-2xl aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto'

function MissionVisionSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-pulse overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="h-6 w-40 bg-neutral-200 rounded" />
          <div className="h-20 w-full bg-neutral-200 rounded" />
          <div className="h-6 w-40 bg-neutral-200 rounded" />
          <div className="h-20 w-full bg-neutral-200 rounded" />
        </div>
        <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full bg-neutral-200 rounded-2xl min-h-0" />
      </div>
    </section>
  )
}

export function AboutMissionVision() {
  const [config, setConfig] = useState<AboutConfig>(DEFAULT_ABOUT)
  const [ready, setReady] = useState(false)

  useEffect(
    () =>
      subscribeToAbout((data) => {
        setConfig(data)
        setReady(true)
      }),
    []
  )

  if (!ready) return <MissionVisionSkeleton />

  const { missionVision } = config

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-[#f7f6f2] overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 lg:items-stretch">
        <div className="min-w-0 flex flex-col gap-8 sm:gap-10 order-2 lg:order-1 lg:h-full lg:justify-center">
          <div>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-foreground mb-3 break-words">
              {missionVision.missionHeadline}
            </h2>
            <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed break-words whitespace-pre-line">
              {missionVision.missionBody}
            </p>
          </div>
          <div>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-foreground mb-3 break-words">
              {missionVision.visionHeadline}
            </h2>
            <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed break-words whitespace-pre-line">
              {missionVision.visionBody}
            </p>
          </div>
        </div>

        <div className="min-w-0 w-full flex flex-col lg:h-full lg:min-h-0 order-1 lg:order-2">
          <div className={MISSION_VISION_IMAGE_FRAME + ' bg-neutral-100'}>
            {missionVision.imageURL ? (
              <img
                src={missionVision.imageURL}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center border border-neutral-200">
                <p className="text-sm text-muted-foreground px-6 text-center break-words">
                  Mission / Vision image — upload from Admin → CMS → About
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
