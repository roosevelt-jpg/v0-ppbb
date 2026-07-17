'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type NewsArticle = {
  id: string
  title?: string
  summary?: string
  category?: string
  author?: string
  image?: string
  slug?: string
  body?: string
  content?: string
}

export default function NewsIndexPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'news'), where('isPublished', '==', true), limit(48))
    return onSnapshot(
      q,
      (snap) => {
        setArticles(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewsArticle, 'id'>) })))
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <h1 className="font-headline text-3xl font-bold mb-6">News</h1>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : articles.length === 0 ? (
          <p className="text-muted-foreground">No news published yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug || article.id}`}
                className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition"
              >
                {article.image ? (
                  <img src={article.image} alt="" className="w-full h-40 object-cover" />
                ) : null}
                <div className="p-4">
                  {article.category ? (
                    <span className="text-xs uppercase text-muted-foreground">{article.category}</span>
                  ) : null}
                  <h2 className="font-bold mt-1 line-clamp-2">{article.title}</h2>
                  {article.summary ? (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{article.summary}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
