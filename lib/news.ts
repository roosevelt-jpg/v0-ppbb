'use client'

import { db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  query,
  where,
  limit,
  type Unsubscribe,
} from 'firebase/firestore'

export type NewsArticle = {
  id: string
  title: string
  summary: string
  category: string
  author: string
  image: string
  slug: string
  body: string
  isPublished: boolean
  publishedAt: Date | null
  createdAt: Date | null
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
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

export function mapNewsDoc(id: string, data: Record<string, unknown>): NewsArticle {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : 'Untitled',
    summary: typeof data.summary === 'string' ? data.summary : '',
    category: typeof data.category === 'string' ? data.category : '',
    author: typeof data.author === 'string' ? data.author : 'Passive Blessings',
    image: typeof data.image === 'string' ? data.image : '',
    slug: typeof data.slug === 'string' ? data.slug : id,
    body:
      (typeof data.body === 'string' && data.body) ||
      (typeof data.content === 'string' && data.content) ||
      '',
    isPublished: data.isPublished === true,
    publishedAt: toDate(data.publishedAt) || toDate(data.createdAt),
    createdAt: toDate(data.createdAt),
  }
}

export function newsArticleHref(article: Pick<NewsArticle, 'id' | 'slug'>): string {
  return `/news/${article.slug || article.id}`
}

export function formatNewsDate(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

export function slugifyNewsTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Latest published articles for homepage / listing. */
export function subscribeToPublishedNews(
  callback: (articles: NewsArticle[]) => void,
  max = 3,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'news'),
    where('isPublished', '==', true),
    limit(Math.max(max, 12))
  )
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => mapNewsDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => {
          const ta = a.publishedAt?.getTime() || a.createdAt?.getTime() || 0
          const tb = b.publishedAt?.getTime() || b.createdAt?.getTime() || 0
          return tb - ta
        })
        .slice(0, max)
      callback(rows)
    },
    (err) => {
      console.error('[news] subscribe published failed:', err)
      onError?.(err)
      callback([])
    }
  )
}

export function subscribeToAllNews(
  callback: (articles: NewsArticle[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'news'),
    (snap) => {
      const rows = snap.docs
        .map((d) => mapNewsDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => {
          const ta = a.publishedAt?.getTime() || a.createdAt?.getTime() || 0
          const tb = b.publishedAt?.getTime() || b.createdAt?.getTime() || 0
          return tb - ta
        })
      callback(rows)
    },
    (err) => {
      console.error('[news] subscribe all failed:', err)
      onError?.(err)
      callback([])
    }
  )
}
