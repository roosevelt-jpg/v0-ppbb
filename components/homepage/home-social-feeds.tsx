'use client'

import React, { useEffect, useState } from 'react'
import { Camera, Play } from 'lucide-react'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
} from '@/lib/homepage-config'
import { YouTubeWidget } from '@/components/youtube-widget'
import { YouTubeConfig } from '@/lib/types'

function SocialSkeleton() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 bg-[#f7f6f2] animate-pulse overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto space-y-8">
        <div className="h-8 w-48 bg-neutral-200 rounded" />
        <div className="h-40 bg-neutral-200 rounded-lg" />
      </div>
    </section>
  )
}

function PlaceholderBlock({
  icon: Icon,
  heading,
  message,
}: {
  icon: React.ElementType
  heading: string
  message: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e4e1da] p-6 sm:p-8 text-center min-w-0">
      <Icon className="h-10 w-10 text-neutral-400 mx-auto mb-4" />
      <h3 className="font-headline text-xl sm:text-2xl font-bold mb-2 break-words">{heading}</h3>
      <p className="font-body text-sm text-muted-foreground break-words">{message}</p>
    </div>
  )
}

export function HomeSocialFeeds() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [ready, setReady] = useState(false)
  const [youtubeConfig, setYoutubeConfig] = useState<YouTubeConfig | null>(null)
  const [youtubeLoading, setYoutubeLoading] = useState(false)

  useEffect(() => {
    const unsub = subscribeToHomepage((data) => {
      setConfig(data)
      setReady(true)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!config.socialFeeds.youtube.isEnabled) {
      setYoutubeConfig(null)
      return
    }

    let cancelled = false
    setYoutubeLoading(true)

    const loadYouTube = async () => {
      try {
        const res = await fetch('/api/youtube/config', { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled && json.success && json.data) {
          setYoutubeConfig(json.data as YouTubeConfig)
        }
      } catch {
        if (!cancelled) setYoutubeConfig(null)
      } finally {
        if (!cancelled) setYoutubeLoading(false)
      }
    }

    void loadYouTube()
    return () => {
      cancelled = true
    }
  }, [config.socialFeeds.youtube.isEnabled])

  if (!ready) return <SocialSkeleton />

  const { socialFeeds } = config
  const showYoutube = socialFeeds.youtube.isEnabled
  const showInstagram = socialFeeds.instagram.isEnabled

  if (!showYoutube && !showInstagram) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 bg-[#f7f6f2] overflow-x-hidden">
        <div className="max-w-[72rem] mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlaceholderBlock
            icon={Play}
            heading={socialFeeds.youtube.heading}
            message="Coming soon — social feeds will appear here."
          />
          <PlaceholderBlock
            icon={Camera}
            heading={socialFeeds.instagram.heading}
            message="Coming soon — social feeds will appear here."
          />
        </div>
      </section>
    )
  }

  const youtubeVideos = youtubeConfig?.videos.slice(0, socialFeeds.youtube.maxVideos) || []

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 bg-[#f7f6f2] overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0 space-y-8">
        {showYoutube && (
          <div className="min-w-0">
            <h2 className="font-headline text-2xl sm:text-3xl font-bold mb-4 break-words text-center">
              {socialFeeds.youtube.heading}
            </h2>
            {youtubeVideos.length > 0 ? (
              <YouTubeWidget videos={youtubeVideos} isLoading={youtubeLoading} />
            ) : (
              <PlaceholderBlock
                icon={Play}
                heading={socialFeeds.youtube.heading}
                message={
                  youtubeLoading
                    ? 'Loading videos…'
                    : 'Coming soon — social feeds will appear here.'
                }
              />
            )}
          </div>
        )}

        {showInstagram && (
          <PlaceholderBlock
            icon={Camera}
            heading={socialFeeds.instagram.heading}
            message="Coming soon — Instagram feed will appear here once credentials are configured."
          />
        )}
      </div>
    </section>
  )
}
