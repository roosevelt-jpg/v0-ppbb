'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function NewsArticlePage() {
  const params = useParams()
  const idOrSlug = String(params.id || '')
  const [article, setArticle] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!idOrSlug) return
    ;(async () => {
      try {
        const byId = await getDoc(doc(db, 'news', idOrSlug))
        if (byId.exists()) {
          setArticle({ id: byId.id, ...byId.data() })
          return
        }
        const snap = await getDocs(
          query(collection(db, 'news'), where('slug', '==', idOrSlug), limit(1))
        )
        if (!snap.empty) {
          const d = snap.docs[0]
          setArticle({ id: d.id, ...d.data() })
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [idOrSlug])

  const title = typeof article?.title === 'string' ? article.title : 'News'
  const body =
    (typeof article?.body === 'string' && article.body) ||
    (typeof article?.content === 'string' && article.content) ||
    (typeof article?.summary === 'string' && article.summary) ||
    ''

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
          <p className="text-muted-foreground">Article not found.</p>
        ) : (
          <article className="space-y-4">
            <h1 className="font-headline text-3xl font-bold">{title}</h1>
            {typeof article.image === 'string' ? (
              <img src={article.image} alt="" className="w-full rounded-lg object-cover max-h-80" />
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
