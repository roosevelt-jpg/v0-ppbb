'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Video, BookOpen } from 'lucide-react'

type Recording = {
  id: string
  title: string
  description?: string
  thumbnailUrl?: string
  videoUrl?: string
  status?: string
}

type Article = {
  id: string
  title: string
  summary?: string
  category?: string
  slug?: string
}

/**
 * Unified Educational Resources page (FEEDBACK_P1.2):
 * recordings + learning articles on one page. Workshops live under Events.
 */
export default function EducationalResourcesPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubs: Array<() => void> = []

    try {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'recordings'), where('status', '==', 'published'), limit(24)),
          (snap) => {
            setRecordings(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Recording, 'id'>) }))
            )
            setLoading(false)
          },
          () => setLoading(false)
        )
      )
    } catch {
      setLoading(false)
    }

    try {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'learningResources'), orderBy('createdAt', 'desc'), limit(24)),
          (snap) => {
            setArticles(
              snap.docs
                .map((d) => ({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }))
                .filter((a) => (a as { status?: string }).status !== 'draft')
            )
          },
          () => {
            /* collection may be empty / missing index */
          }
        )
      )
    } catch {
      /* ignore */
    }

    return () => unsubs.forEach((u) => u())
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <header>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold mb-2">Educational Resources</h1>
            <p className="text-muted-foreground max-w-2xl">
              Watch recordings and explore learning articles from Passive Blessings. Workshops and
              classes are listed under Events.
            </p>
          </header>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              <h2 className="text-xl font-bold">Recordings</h2>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : recordings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published recordings yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recordings.map((r) => (
                  <Link
                    key={r.id}
                    href={`/recordings/${r.id}`}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition bg-card"
                  >
                    {r.thumbnailUrl ? (
                      <img src={r.thumbnailUrl} alt="" className="w-full aspect-video object-cover" />
                    ) : (
                      <div className="w-full aspect-video bg-neutral-100 flex items-center justify-center">
                        <Video className="w-8 h-8 text-neutral-300" />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-semibold line-clamp-2">{r.title}</h3>
                      {r.description ? (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/recordings" className="text-sm font-medium underline">
              View all recordings →
            </Link>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-xl font-bold">Learning articles</h2>
            </div>
            {articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Articles from Admin → CMS → Learning will appear here.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {articles.map((a) => (
                  <article key={a.id} className="border rounded-lg p-4 bg-card">
                    {a.category ? (
                      <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{a.category}</span>
                    ) : null}
                    <h3 className="font-semibold mt-2">{a.title}</h3>
                    {a.summary ? (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{a.summary}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
