'use client'

import React, { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  HomepageStatItem,
} from '@/lib/homepage-config'

interface LiveCounts {
  members: number
  events: number
  donations: number
}

function parseStatNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : 0
}

function getLiveDisplayValue(item: HomepageStatItem, counts: LiveCounts): string {
  const label = item.label.toUpperCase()
  if (label.includes('MEMBER')) return `${counts.members.toLocaleString()}+`
  if (label.includes('EVENT')) return `${counts.events.toLocaleString()}+`
  if (label.includes('FUND') || label.includes('RAIS')) {
    const aed = counts.donations
    if (aed >= 1_000_000) return `${(aed / 1_000_000).toFixed(aed >= 10_000_000 ? 0 : 1)}M AED`
    if (aed >= 1_000) return `${Math.round(aed / 1_000)}K AED`
    return `AED ${Math.round(aed).toLocaleString()}`
  }
  return item.number
}

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!active || started.current) return
    started.current = true
    const start = performance.now()
    const from = 0

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [active, target, duration])

  return value
}

function StatCell({
  item,
  displayValue,
  animate,
}: {
  item: HomepageStatItem
  displayValue: string
  animate: boolean
}) {
  const numericTarget = parseStatNumber(displayValue)
  const animated = useCountUp(numericTarget, animate && numericTarget > 0)
  const hasNumeric = numericTarget > 0 && animate

  let shown = displayValue
  if (hasNumeric) {
    if (displayValue.includes('M AED') || displayValue.includes('K AED')) {
      shown = displayValue
    } else if (displayValue.includes('+')) {
      shown = `${Math.round(animated).toLocaleString()}+`
    } else if (displayValue.includes('AED')) {
      shown = displayValue
    } else {
      shown = Math.round(animated).toLocaleString()
    }
  }

  return (
    <div className="flex flex-col items-center text-center px-1 sm:px-2 min-w-0">
      <div className="font-headline text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 break-words max-w-full">
        {shown}
      </div>
      <p className="eyebrow text-muted-foreground text-[0.6rem] sm:text-xs break-words max-w-full leading-snug">
        {item.label}
      </p>
    </div>
  )
}

export function HomeStatsBar() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [liveCounts, setLiveCounts] = useState<LiveCounts>({ members: 0, events: 0, donations: 0 })
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => subscribeToHomepage(setConfig), [])

  useEffect(() => {
    if (config.stats.displayMode !== 'live') return

    const unsubs: (() => void)[] = []

    unsubs.push(
      onSnapshot(query(collection(db, 'users'), where('role', '==', 'member')), (snap) => {
        setLiveCounts((prev) => ({ ...prev, members: snap.size }))
      })
    )
    unsubs.push(
      onSnapshot(query(collection(db, 'events'), where('status', '==', 'published')), (snap) => {
        setLiveCounts((prev) => ({ ...prev, events: snap.size }))
      })
    )
    unsubs.push(
      onSnapshot(query(collection(db, 'donations'), where('status', '==', 'completed')), (snap) => {
        const total = snap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0)
        setLiveCounts((prev) => ({ ...prev, donations: total }))
      })
    )

    return () => unsubs.forEach((u) => u())
  }, [config.stats.displayMode])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const items = config.stats.items.slice(0, 4)

  return (
    <section ref={sectionRef} id="impact" className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 bg-background border-y border-border/40 overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {items.map((item, index) => {
            const displayValue =
              config.stats.displayMode === 'live'
                ? getLiveDisplayValue(item, liveCounts)
                : item.number
            return (
              <StatCell
                key={`${item.label}-${index}`}
                item={item}
                displayValue={displayValue}
                animate={inView}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
