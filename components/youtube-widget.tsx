'use client'

import React from 'react'
import { YouTubeVideo } from '@/lib/types'
import { Play } from 'lucide-react'
import { formatDuration, formatViewCount } from '@/lib/youtube-service'

interface YouTubeWidgetProps {
  videos: YouTubeVideo[]
  isLoading?: boolean
  heading?: string
  channelId?: string
  /** Marquee loop duration in seconds */
  marqueeSpeed?: number
}

function VideoCard({ video }: { video: YouTubeVideo }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0 w-[260px] sm:w-[300px] rounded-lg overflow-hidden bg-neutral-900 hover:shadow-xl transition-shadow"
    >
      <div className="relative overflow-hidden bg-black aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
          <div className="bg-red-600 rounded-full p-2.5 scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
        {video.duration ? (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-white text-xs font-semibold">
            {formatDuration(video.duration)}
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm group-hover:text-red-400 transition-colors line-clamp-2 mb-1.5">
          {video.title}
        </h3>
        <div className="flex justify-between items-center gap-2 text-xs text-neutral-400">
          <span>{formatViewCount(video.viewCount)} views</span>
          <span>
            {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : ''}
          </span>
        </div>
      </div>
    </a>
  )
}

export function YouTubeWidget({
  videos,
  isLoading = false,
  heading = 'Latest from Our YouTube Channel',
  channelId,
  marqueeSpeed = 45,
}: YouTubeWidgetProps) {
  if (isLoading) {
    return (
      <div className="w-full overflow-hidden">
        <div className="flex gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[260px] sm:w-[300px] rounded-lg overflow-hidden bg-neutral-200">
              <div className="w-full aspect-video bg-neutral-300" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-neutral-300 rounded w-3/4" />
                <div className="h-3 bg-neutral-300 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="bg-neutral-100 rounded-lg p-10 text-center">
        <p className="text-neutral-600 text-sm">No videos available. Check back soon!</p>
      </div>
    )
  }

  // Duplicate for seamless infinite scroll
  const loop = videos.length === 1 ? [...videos, ...videos, ...videos] : [...videos, ...videos]
  const channelUrl = channelId
    ? `https://www.youtube.com/channel/${channelId}`
    : 'https://www.youtube.com'

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900">{heading}</h3>
          <p className="text-neutral-600 text-sm mt-1">
            Videos rotate every day — subscribe for the latest
          </p>
        </div>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pb-compact-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-black text-white text-xs font-semibold hover:bg-neutral-800 w-fit"
        >
          Visit YouTube →
        </a>
      </div>

      <div className="w-full overflow-hidden" aria-label="YouTube videos marquee">
        <div
          className="youtube-marquee-track flex items-stretch"
          style={
            {
              '--youtube-marquee-duration': `${marqueeSpeed}s`,
              gap: '1rem',
            } as React.CSSProperties
          }
        >
          {loop.map((video, i) => (
            <VideoCard key={`${video.videoId}-${i}`} video={video} />
          ))}
        </div>
      </div>
    </div>
  )
}
