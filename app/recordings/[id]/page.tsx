'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ArrowLeft } from 'lucide-react'

type Recording = {
  id: string
  title?: string
  description?: string
  url?: string
  thumbnailUrl?: string
  speaker?: string
  type?: string
  date?: string
  duration?: number
}

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

export default function RecordingDetailPage() {
  const params = useParams()
  const id = String(params.id || '')
  const [recording, setRecording] = useState<Recording | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await fetch('/api/recordings?status=published&limit=200', { cache: 'no-store' })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          const match = json.data.find((r: Recording) => r.id === id) || null
          setRecording(match)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const mediaUrl = recording?.url || ''
  const embed = mediaUrl ? toEmbedUrl(mediaUrl) : null
  const isDirectVideo =
    mediaUrl &&
    !embed &&
    (mediaUrl.includes('.mp4') ||
      mediaUrl.includes('.webm') ||
      mediaUrl.includes('firebasestorage') ||
      mediaUrl.includes('storage.googleapis.com'))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <Link href="/educational-resources" className="inline-flex items-center gap-2 text-sm underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Educational Resources
        </Link>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !recording ? (
          <p className="text-muted-foreground">Recording not found or not published.</p>
        ) : (
          <article className="space-y-4">
            <h1 className="font-headline text-3xl font-bold">{recording.title}</h1>
            {recording.speaker ? (
              <p className="text-sm text-muted-foreground">By {recording.speaker}</p>
            ) : null}
            {recording.description ? (
              <p className="text-neutral-700 whitespace-pre-wrap">{recording.description}</p>
            ) : null}

            {embed ? (
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
                <iframe
                  src={embed}
                  title={recording.title || 'Recording'}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : isDirectVideo ? (
              <video
                src={mediaUrl}
                controls
                poster={recording.thumbnailUrl || undefined}
                className="w-full rounded-lg border bg-black aspect-video"
              />
            ) : mediaUrl ? (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm font-semibold"
              >
                Open recording
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No media URL on this recording.</p>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}
