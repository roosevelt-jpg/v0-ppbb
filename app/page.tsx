'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { HomeHero } from '@/components/homepage/home-hero'
import { HomeStatsBar } from '@/components/homepage/home-stats-bar'
import { PartnersMarquee } from '@/components/homepage/partners-marquee'
import { HomeMission } from '@/components/homepage/home-mission'
import { HomePillars } from '@/components/homepage/home-pillars'
import { HomeUpcomingEvents } from '@/components/homepage/home-upcoming-events'
import { HomeDonationBanner } from '@/components/homepage/home-donation-banner'
import { HomeSocialFeeds } from '@/components/homepage/home-social-feeds'
import { HomeTestimonials } from '@/components/homepage/home-testimonials'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const [causes, setCauses] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])

  useEffect(() => {
    const unsubscribers: (() => void)[] = []

    try {
      const causesQuery = query(collection(db, 'causes'), where('status', '==', 'active'), limit(3))
      unsubscribers.push(
        onSnapshot(
          causesQuery,
          (snapshot) => setCauses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
          (error) => console.error('Causes listener error:', error)
        )
      )

      const sponsorsQuery = query(
        collection(db, 'sponsors'),
        where('partnershipStatus', '==', 'active'),
        limit(6)
      )
      unsubscribers.push(
        onSnapshot(
          sponsorsQuery,
          (snapshot) => setSponsors(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
          (error) => console.error('Sponsors listener error:', error)
        )
      )

      const newsQuery = query(collection(db, 'news'), where('isPublished', '==', true), limit(3))
      unsubscribers.push(
        onSnapshot(
          newsQuery,
          (snapshot) => setNews(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
          (error) => console.error('News listener error:', error)
        )
      )
    } catch (error) {
      console.error('Error setting up listeners:', error)
    }

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [])

  return (
    <div className="w-full bg-background text-foreground overflow-x-hidden">
      <Navbar />

      <HomeHero />
      <HomeStatsBar />
      <PartnersMarquee />
      <HomeMission />
      <HomePillars />
      <HomeUpcomingEvents />
      <HomeDonationBanner />
      <HomeSocialFeeds />
      <HomeTestimonials />

      {/* ACTIVE CAUSES - Mobile First */}
      {causes.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 bg-[#f7f6f2]">
          <div className="max-w-[72rem] mx-auto w-full min-w-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 font-headline">
              Active Causes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {causes.map((cause) => {
                const percentage = (cause.currentAmount / cause.goalAmount) * 100
                return (
                  <div key={cause.id} className="bg-white rounded-lg overflow-hidden border border-[#e4e1da]">
                    {cause.image && (
                      <img src={cause.image} alt={cause.title} className="w-full h-32 sm:h-40 object-cover" />
                    )}
                    <div className="p-3 sm:p-4">
                      <h3 className="font-bold text-base sm:text-lg mb-1">{cause.title}</h3>
                      <p className="text-xs sm:text-sm text-[#888888] mb-2 line-clamp-2">{cause.description}</p>

                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>AED {(cause.currentAmount || 0).toLocaleString()}</span>
                          <span className="text-[#888888]">
                            of AED {(cause.goalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-[#e4e1da] rounded-full h-1.5">
                          <div
                            className="bg-[#111111] h-1.5 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      <Link href="/donate">
                        <Button size="sm" className="w-full bg-[#111111] hover:bg-[#333333] text-white text-xs py-1">
                          Support
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* SPONSORS & PARTNERS - Mobile First */}
      {sponsors.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="max-w-[72rem] mx-auto w-full min-w-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-headline">
              Our Partners & Sponsors
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="bg-white p-4 sm:p-6 rounded-lg border border-[#e4e1da] flex items-center justify-center min-h-[120px]"
                >
                  {sponsor.logo ? (
                    <img
                      src={sponsor.logo}
                      alt={sponsor.companyName}
                      className="max-w-full max-h-12 object-contain"
                    />
                  ) : (
                    <p className="text-xs sm:text-sm text-center font-bold text-[#333333]">
                      {sponsor.companyName}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-10 sm:mt-12">
              <Link href="/dashboard/sponsor-profile">
                <Button size="lg" className="bg-[#111111] hover:bg-[#333333] text-white">
                  Become a Partner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* NEWS - Mobile First */}
      {news.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
          <div className="max-w-[72rem] mx-auto w-full min-w-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-headline">
              Latest News
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-lg overflow-hidden border border-[#e4e1da] hover:shadow-md transition-shadow"
                >
                  {article.image && (
                    <img src={article.image} alt={article.title} className="w-full h-40 sm:h-48 object-cover" />
                  )}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase text-[#888888] bg-[#e4e1da] px-2 py-1 rounded">
                        {article.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2">{article.title}</h3>
                    <p className="text-xs sm:text-sm text-[#888888] mb-3 line-clamp-2">{article.summary}</p>
                    <p className="text-xs text-[#888888]">By {article.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
