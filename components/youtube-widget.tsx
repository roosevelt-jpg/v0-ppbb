'use client'

import React from 'react'
import { YouTubeVideo } from '@/lib/types'
import { Play } from 'lucide-react'
import { formatDuration, formatViewCount } from '@/lib/youtube-service'

interface YouTubeWidgetProps {
  videos: YouTubeVideo[]
  isLoading?: boolean
}

export function YouTubeWidget({ videos, isLoading = false }: YouTubeWidgetProps) {
  if (isLoading) {
    return (
      <div className="w-full">
        <h2 className="text-3xl font-bold text-neutral-900 mb-8">Latest from Our YouTube Channel</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden bg-neutral-200 animate-pulse">
              <div className="w-full aspect-video bg-neutral-300" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-neutral-300 rounded w-3/4" />
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
      <div className="w-full">
        <h2 className="text-3xl font-bold text-neutral-900 mb-8">Latest from Our YouTube Channel</h2>
        <div className="bg-neutral-100 rounded-lg p-12 text-center">
          <p className="text-neutral-600">No videos available. Check back soon!</p>
        </div>
      </div>
    )
  }

  // Display maximum of 3 videos for homepage (user preference)
  const displayVideos = videos.slice(0, 3)

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">Latest from Our YouTube Channel</h3>
          <p className="text-neutral-600 mt-2">Subscribe to stay updated with our latest content</p>
        </div>
        <a
          href={`https://www.youtube.com/channel/${videos[0]?.channelTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors min-h-[44px] shrink-0 self-start sm:self-auto"
        >
          <span>Visit YouTube</span>
          <span>→</span>
        </a>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
        {displayVideos.map(video => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg overflow-hidden bg-neutral-900 hover:shadow-xl transition-shadow"
          >
            {/* Thumbnail Container */}
            <div className="relative overflow-hidden bg-black aspect-video">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                <div className="bg-red-600 rounded-full p-3 scale-75 group-hover:scale-100 transition-transform">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>

              {/* Duration Badge */}
              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs font-semibold">
                  {formatDuration(video.duration)}
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-white group-hover:text-red-500 transition-colors line-clamp-2 mb-2">
                {video.title}
              </h3>

              <div className="flex flex-col gap-1 text-sm text-neutral-400">
                <p className="line-clamp-1">{video.channelTitle}</p>
                <div className="flex justify-between items-center">
                  <span>{formatViewCount(video.viewCount)} views</span>
                  <span className="text-xs">
                    {video.publishedAt && new Date(video.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
