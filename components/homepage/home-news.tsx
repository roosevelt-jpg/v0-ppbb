'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, User, ArrowRight } from 'lucide-react'
import {
  formatNewsDate,
  newsArticleHref,
  subscribeToPublishedNews,
  type NewsArticle,
} from '@/lib/news'

export function HomeNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    return subscribeToPublishedNews((rows) => {
      setArticles(rows)
      setReady(true)
    }, 3)
  }, [])

  if (!ready) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-white animate-pulse">
        <div className="max-w-[72rem] mx-auto">
          <div className="h-10 w-48 bg-neutral-200 rounded mx-auto mb-3" />
          <div className="h-4 w-64 bg-neutral-100 rounded mx-auto mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-neutral-100 rounded" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-white">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline text-[#111111]">
            Press Room
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#666666]">
            Stories, updates, and community news from Passive Blessings
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-10 border border-[#e4e1da] rounded-lg bg-[#f7f6f2]">
            <p className="text-sm text-[#666666] mb-4">No stories published yet.</p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111] underline"
            >
              Visit the news page
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
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
                          clipPath:
                            'polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)',
                        }}
                      />
                    ) : (
                      <div
                        className="w-full aspect-[4/3] bg-neutral-200 flex items-center justify-center text-neutral-400 text-sm"
                        style={{
                          clipPath:
                            'polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)',
                        }}
                      >
                        Passive Blessings
                      </div>
                    )}
                  </div>

                  <h3 className="font-headline font-bold text-base sm:text-lg text-[#222222] leading-snug px-2 mb-4 line-clamp-3 group-hover:underline">
                    {article.title}
                  </h3>

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

            <div className="text-center mt-8 sm:mt-10">
              <Link
                href="/news"
                className="inline-flex items-center gap-2 bg-[#111111] hover:bg-[#333333] text-white text-sm font-semibold px-5 py-2.5 rounded-md"
              >
                View all news
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
