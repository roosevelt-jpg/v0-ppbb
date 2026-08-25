'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import {
  CharityCase,
  normalizeCharityCase,
  progressPercent,
  truncateAtWord,
  mergeCharityCaseLists,
} from '@/lib/charity-cases'
import { ArrowRight, Heart, HandHeart } from 'lucide-react'

/**
 * Part 10A — Active charity causes for members.
 * Merges charityCases + legacy causes so older posts still appear.
 */
export default function MemberCharityCausesPage() {
  const [causes, setCauses] = useState<CharityCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let fromCases: CharityCase[] = []
    let fromLegacy: CharityCase[] = []
    let casesReady = false
    let legacyReady = false

    const merge = () => {
      if (!casesReady || !legacyReady) return
      setCauses(
        mergeCharityCaseLists(fromCases, fromLegacy).filter((c) => c.status === 'active')
      )
      setLoading(false)
    }

    const unsubCases = onSnapshot(
      query(collection(db, 'charityCases'), where('status', '==', 'active')),
      (snap) => {
        fromCases = snap.docs.map((d) =>
          normalizeCharityCase(d.id, d.data() as Record<string, unknown>, 'charityCases')
        )
        casesReady = true
        merge()
      },
      () => {
        casesReady = true
        merge()
      }
    )

    const unsubLegacy = onSnapshot(
      query(collection(db, 'causes'), where('status', '==', 'active')),
      (snap) => {
        fromLegacy = snap.docs.map((d) =>
          normalizeCharityCase(d.id, d.data() as Record<string, unknown>, 'causes')
        )
        legacyReady = true
        merge()
      },
      () => {
        legacyReady = true
        merge()
      }
    )

    return () => {
      unsubCases()
      unsubLegacy()
    }
  }, [])

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <p
          className="text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-muted-foreground mb-2"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Charity
        </p>
        <h1
          className="text-3xl sm:text-4xl text-neutral-900 dark:text-foreground"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Active Causes
        </h1>
        <p className="text-sm text-neutral-600 dark:text-muted-foreground mt-2 max-w-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          Support verified causes. You will complete payment through our charitable partners.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
          ))}
        </div>
      ) : causes.length === 0 ? (
        <div
          className="text-center py-14 px-4 bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-lg"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <HandHeart className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-700 dark:text-neutral-200 mb-1">No active causes right now</p>
          <p className="text-sm text-neutral-500 dark:text-muted-foreground mb-6">
            Check back soon, or apply for support if you need help.
          </p>
          <Link
            href="/dashboard/charity-requests?apply=1"
            className="inline-flex min-h-[44px] items-center justify-center px-5 bg-black text-white text-sm font-semibold rounded"
          >
            Apply for Support
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {causes.map((cause) => {
            const pct = progressPercent(cause.amountRaised, cause.targetAmount)
            return (
              <article
                key={cause.id}
                className="bg-white dark:bg-card border border-neutral-100 dark:border-border rounded-lg overflow-hidden flex flex-col"
              >
                {cause.bannerImage ? (
                  <img
                    src={cause.bannerImage}
                    alt={cause.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-neutral-300" />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-muted-foreground mb-1">
                    {cause.category}
                  </span>
                  <h2
                    className="text-lg text-neutral-900 dark:text-foreground mb-2"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {cause.title}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-muted-foreground mb-4 flex-1">
                    {truncateAtWord(cause.description)}
                  </p>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>AED {cause.amountRaised.toLocaleString()}</span>
                      <span className="text-neutral-500 dark:text-muted-foreground">
                        AED {cause.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full">
                      <div
                        className="bg-neutral-900 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    href={`/donate?cause=${encodeURIComponent(cause.id)}`}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 text-white text-sm font-semibold rounded"
                  >
                    Donate Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-10 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
        <Link
          href="/dashboard/charity-requests?apply=1"
          className="inline-flex min-h-[44px] items-center text-sm underline underline-offset-4 text-neutral-700 dark:text-neutral-200"
        >
          Need support? Apply for Charity Support
        </Link>
      </div>
    </div>
  )
}
