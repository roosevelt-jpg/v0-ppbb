'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  type HomepageAdvertisingBanner,
} from '@/lib/homepage-config'

export function HomeAdvertisingBanner() {
  const [banner, setBanner] = useState<HomepageAdvertisingBanner>(
    DEFAULT_HOMEPAGE.advertisingBanner
  )

  useEffect(() => {
    return subscribeToHomepage((cfg) => {
      setBanner(cfg.advertisingBanner || DEFAULT_HOMEPAGE.advertisingBanner)
    })
  }, [])

  if (!banner.enabled || !banner.imageURL) return null

  const inner = (
    <img
      src={banner.imageURL}
      alt={banner.alt || 'Advertisement'}
      className="w-full h-auto max-h-40 sm:max-h-48 object-cover object-center"
    />
  )

  return (
    <section className="w-full border-y border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950" aria-label="Advertisement">
      <div className="max-w-[72rem] mx-auto">
        {banner.href ? (
          <Link
            href={banner.href}
            target={banner.href.startsWith('http') ? '_blank' : undefined}
            rel={banner.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="block"
          >
            {inner}
          </Link>
        ) : (
          inner
        )}
      </div>
    </section>
  )
}
