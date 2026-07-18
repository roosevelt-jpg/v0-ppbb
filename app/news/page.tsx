'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Calendar, User } from 'lucide-react'
import {
  formatNewsDate,
  newsArticleHref,
  subscribeToPublishedNews,
  type NewsArticle,
} from '@/lib/news'

export default function NewsIndexPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return subscribeToPublishedNews(
      (rows) => {
        setArticles(rows)
        setLoading(false)
      },
      48,
      () => setLoading(false)
    )
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="max-w-[72rem] mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-[#111111]">
              Press Room
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#666666]">
              Read the latest stories and updates from Passive Blessings
            </p>
          </div>

          {loading ? (
            <p className="text-center text-[#888888]">Loading…</p>
          ) : articles.length === 0 ? (
            <p className="text-center text-[#888888]">No news published yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={newsArticleHref(article)}
                  className="group flex flex-col text-center"
                >
                  <div className="relative overflow-hidden bg-neutral-100 mb-5">
                    {article.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)',
                        }}
                      />
                    ) : (
                      <div
                        className="w-full aspect-[4/3] bg-neutral-200"
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)',
                        }}
                      />
                    )}
                  </div>
                  {article.category ? (
                    <p className="text-xs uppercase tracking-wide text-[#888888] mb-2">
                      {article.category}
                    </p>
                  ) : null}
                  <h2 className="font-headline font-bold text-base sm:text-lg text-[#222222] leading-snug px-2 mb-3 line-clamp-3 group-hover:underline">
                    {article.title}
                  </h2>
                  {article.summary ? (
                    <p className="text-sm text-[#666666] px-2 mb-4 line-clamp-2">{article.summary}</p>
                  ) : null}
                  <div className="mt-auto border-t border-[#e4e1da] pt-3 px-1 flex items-center justify-between gap-2 text-xs text-[#888888]">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-[#111111]" />
                      <span className="truncate">
                        {formatNewsDate(article.publishedAt) || 'Recent'}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <User className="h-3.5 w-3.5 shrink-0 text-[#111111]" />
                      <span className="truncate">By {article.author}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
