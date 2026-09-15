'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { mediaUrl } from '@/lib/media-url'

export default function NewsArticlePage() {
  const params = useParams()
  const rawParam = String(params.id || '')
  const idOrSlug = (() => {
    try {
      return decodeURIComponent(rawParam).trim()
    } catch {
      return rawParam.trim()
    }
  })()
  const [article, setArticle] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idOrSlug) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // 1) Direct doc id (preferred — list links use id)
        const byId = await getDoc(doc(db, 'news', idOrSlug))
        if (byId.exists()) {
          const data = byId.data() || {}
          if (data.isPublished === true || data.isPublished === undefined) {
            if (!cancelled) setArticle({ id: byId.id, ...data })
            return
          }
        }

        // 2) Slug lookup — must include isPublished so public rules allow the query
        const bySlug = await getDocs(
          query(
            collection(db, 'news'),
            where('slug', '==', idOrSlug),
            where('isPublished', '==', true),
            limit(1)
          )
        )
        if (!bySlug.empty) {
          const d = bySlug.docs[0]
          if (!cancelled) setArticle({ id: d.id, ...d.data() })
          return
        }

        // 3) Legacy truncated slugs / trailing hyphen mismatches
        const published = await getDocs(
          query(collection(db, 'news'), where('isPublished', '==', true), limit(48))
        )
        const needle = idOrSlug.replace(/-+$/g, '').toLowerCase()
        const match = published.docs.find((d) => {
          const slug = String(d.data().slug || '')
            .toLowerCase()
            .replace(/-+$/g, '')
          return (
            slug === needle ||
            slug.startsWith(needle) ||
            needle.startsWith(slug) ||
            d.id === idOrSlug
          )
        })
        if (match && !cancelled) {
          setArticle({ id: match.id, ...match.data() })
          return
        }

        if (!cancelled) setArticle(null)
      } catch (err) {
        console.error('[news/article]', err)
        if (!cancelled) {
          setArticle(null)
          setError('Could not load this article.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [idOrSlug])

  const title = typeof article?.title === 'string' ? article.title : 'News'
  const body =
    (typeof article?.body === 'string' && article.body) ||
    (typeof article?.content === 'string' && article.content) ||
    (typeof article?.summary === 'string' && article.summary) ||
    ''
  const image =
    mediaUrl(
      (typeof article?.image === 'string' && article.image) ||
        (typeof article?.coverImage === 'string' && article.coverImage) ||
        (typeof article?.imageURL === 'string' && article.imageURL) ||
        (typeof article?.imageUrl === 'string' && article.imageUrl) ||
        ''
    ) || ''

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <Link href="/news" className="text-sm underline mb-6 inline-block">
          ← All news
        </Link>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !article ? (
          <p className="text-muted-foreground">{error || 'Article not found.'}</p>
        ) : (
          <article className="space-y-4">
            <h1 className="font-headline text-3xl font-bold">{title}</h1>
            {typeof article.author === 'string' || typeof article.publishedAt !== 'undefined' ? (
              <p className="text-sm text-[#888888]">
                {typeof article.author === 'string' ? `By ${article.author}` : null}
                {typeof article.author === 'string' ? ' · ' : null}
                <Link href="/news" className="underline">
                  Press Room
                </Link>
              </p>
            ) : null}
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="w-full rounded-lg object-cover max-h-80" />
            ) : null}
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: body.includes('<') ? body : `<p>${body.replace(/\n/g, '<br>')}</p>`,
              }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}
