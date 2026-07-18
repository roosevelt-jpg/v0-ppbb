'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Video, BookOpen } from 'lucide-react'
import {
  LEARNING_TYPE_OPTIONS,
  SPIRITUAL_CATEGORY_OPTIONS,
} from '@/lib/learning-resources'

type Recording = {
  id: string
  title: string
  description?: string
  thumbnailUrl?: string
  videoUrl?: string
  status?: string
  category?: string
  author?: string
  createdAt?: { toDate?: () => Date } | string | Date
}

type Article = {
  id: string
  title: string
  summary?: string
  description?: string
  category?: string
  type?: string
  author?: string
  slug?: string
  status?: string
  createdAt?: { toDate?: () => Date } | string | Date
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate()
    } catch {
      return null
    }
  }
  return null
}

function matchesKeyword(haystack: string, keyword: string): boolean {
  if (!keyword.trim()) return true
  return haystack.toLowerCase().includes(keyword.trim().toLowerCase())
}

/**
 * Unified Educational Resources page (FEEDBACK_P1.2):
 * recordings + learning articles on one page, with keyword/category/author/type/date filters.
 */
export default function EducationalResourcesPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [author, setAuthor] = useState('')
  const [type, setType] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/recordings?status=published&limit=48', { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (json.success && Array.isArray(json.data)) {
          setRecordings(
            json.data.map((row: Record<string, unknown>) => ({
              id: String(row.id),
              title: String(row.title || 'Untitled'),
              description: typeof row.description === 'string' ? row.description : '',
              thumbnailUrl:
                (typeof row.thumbnailUrl === 'string' && row.thumbnailUrl) ||
                (typeof row.thumbnail === 'string' && row.thumbnail) ||
                '',
              videoUrl: typeof row.url === 'string' ? row.url : '',
              status: typeof row.status === 'string' ? row.status : 'published',
              category: typeof row.category === 'string' ? row.category : '',
              author: typeof row.speaker === 'string' ? row.speaker : '',
              createdAt: (row.createdAt as Recording['createdAt']) || (row.date as string) || null,
            }))
          )
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()

    let unsubArticles = () => {}
    try {
      unsubArticles = onSnapshot(
        query(collection(db, 'learningResources'), orderBy('createdAt', 'desc'), limit(48)),
        (snap) => {
          setArticles(
            snap.docs
              .map((d) => ({ id: d.id, ...(d.data() as Omit<Article, 'id'>) }))
              .filter((a) => a.status !== 'draft')
          )
        },
        () => {
          /* collection may be empty / missing index */
        }
      )
    } catch {
      /* ignore */
    }

    return () => {
      cancelled = true
      unsubArticles()
    }
  }, [])

  const inDateRange = (value: unknown) => {
    const d = toDate(value)
    if (!dateFrom && !dateTo) return true
    if (!d) return false
    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      if (d < from) return false
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      if (d > to) return false
    }
    return true
  }

  const filteredRecordings = useMemo(() => {
    return recordings.filter((r) => {
      const blob = [r.title, r.description, r.author, r.category].filter(Boolean).join(' ')
      if (!matchesKeyword(blob, keyword)) return false
      if (author.trim() && !matchesKeyword(String(r.author || ''), author)) return false
      if (category !== 'all' && String(r.category || '').toLowerCase() !== category) return false
      if (type !== 'all' && type !== 'video') return false
      return inDateRange(r.createdAt)
    })
  }, [recordings, keyword, author, category, type, dateFrom, dateTo])

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const blob = [a.title, a.summary, a.description, a.author, a.category].filter(Boolean).join(' ')
      if (!matchesKeyword(blob, keyword)) return false
      if (author.trim() && !matchesKeyword(String(a.author || ''), author)) return false
      if (category !== 'all' && String(a.category || '').toLowerCase() !== category) return false
      if (type !== 'all' && String(a.type || 'article').toLowerCase() !== type) return false
      return inDateRange(a.createdAt)
    })
  }, [articles, keyword, author, category, type, dateFrom, dateTo])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <header>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold mb-2">Educational Resources</h1>
            <p className="text-muted-foreground max-w-2xl">
              Watch recordings and explore learning articles from Passive Blessings. Workshops and
              classes are listed under Events.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border border-[#e4e1da] rounded-lg p-4 bg-white">
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Keyword"
              className="min-h-[44px] px-3 border border-[#e4e1da] rounded-lg text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-[44px] px-3 border border-[#e4e1da] rounded-lg text-sm"
            >
              <option value="all">All categories</option>
              {SPIRITUAL_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              <option value="general">General</option>
            </select>
            <input
              type="search"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author"
              className="min-h-[44px] px-3 border border-[#e4e1da] rounded-lg text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="min-h-[44px] px-3 border border-[#e4e1da] rounded-lg text-sm"
            >
              <option value="all">All types</option>
              <option value="video">Recording / video</option>
              {LEARNING_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="min-h-[44px] px-2 border border-[#e4e1da] rounded-lg text-sm"
                aria-label="From date"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="min-h-[44px] px-2 border border-[#e4e1da] rounded-lg text-sm"
                aria-label="To date"
              />
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              <h2 className="text-xl font-bold">Recordings</h2>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filteredRecordings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recordings match these filters.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecordings.map((r) => (
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
                      {r.author ? (
                        <p className="text-xs text-muted-foreground mt-1">By {r.author}</p>
                      ) : null}
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
            {filteredArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No articles match these filters. Content is managed in Admin → CMS → Learning.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredArticles.map((a) => (
                  <article key={a.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex flex-wrap gap-2">
                      {a.category ? (
                        <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{a.category}</span>
                      ) : null}
                      {a.type ? (
                        <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{a.type}</span>
                      ) : null}
                    </div>
                    <h3 className="font-semibold mt-2">{a.title}</h3>
                    {a.author ? (
                      <p className="text-xs text-muted-foreground mt-1">By {a.author}</p>
                    ) : null}
                    {a.summary || a.description ? (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {a.summary || a.description}
                      </p>
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
