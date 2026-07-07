'use client'

import React, { useEffect, useState } from 'react'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  splitMissionHeadline,
} from '@/lib/homepage-config'

function MissionSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 animate-pulse">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="h-3 w-32 bg-neutral-200 rounded" />
          <div className="h-12 w-full bg-neutral-200 rounded" />
          <div className="h-24 w-full bg-neutral-200 rounded" />
        </div>
        <div className="aspect-video bg-neutral-200 rounded-2xl" />
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
    <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-background">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <p className="eyebrow text-muted-foreground mb-4">{mission.eyebrow}</p>
          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold leading-snug mb-6 text-foreground">
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
          <p
            className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed w-full"
            style={{ maxWidth: '42rem' }}
          >
            {mission.body}
          </p>
        </div>

        <div>
          {mission.imageURL ? (
            <img
              src={mission.imageURL}
              alt=""
              className="w-full aspect-[4/3] object-cover rounded-2xl"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-neutral-100 rounded-2xl flex items-center justify-center border border-neutral-200">
              <p className="text-sm text-muted-foreground font-body px-6 text-center">
                Mission image — upload from Admin → CMS → Homepage
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
