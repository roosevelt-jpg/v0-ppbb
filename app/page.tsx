'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { HomeHero } from '@/components/homepage/home-hero'
import { HomeStatsBar } from '@/components/homepage/home-stats-bar'
import { PartnersMarquee } from '@/components/homepage/partners-marquee'
import { HomeMission } from '@/components/homepage/home-mission'
import { YouTubeWidget } from '@/components/youtube-widget'
import EventCard from '@/components/event-card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users2, Heart, Zap, Building2, BookOpen, Briefcase, Calendar } from 'lucide-react'
import { YouTubeConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [causes, setCauses] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [youtubeConfig, setYoutubeConfig] = useState<YouTubeConfig | null>(null)

  useEffect(() => {
    const statsListeners: (() => void)[] = []
    
    try {
      // YouTube config is served by a public Admin SDK route (/api/youtube/config);
      // client reads of `youtubeConfig` are denied by deployed Firestore rules.
      let youtubeCancelled = false
      const loadYouTube = async () => {
        try {
          const res = await fetch('/api/youtube/config', { cache: 'no-store' })
          const json = await res.json()
          if (!youtubeCancelled && json.success && json.data) {
            setYoutubeConfig(json.data as YouTubeConfig)
          }
        } catch (err) {
          console.error('[v0] YouTube config fetch error:', err)
        }
      }
      loadYouTube()
      const youtubeInterval = setInterval(loadYouTube, 60000)
      statsListeners.push(() => {
        youtubeCancelled = true
        clearInterval(youtubeInterval)
      })

      // Upcoming events - fetch 8+ events sorted by date for homepage display
      const upcomingQuery = query(
        collection(db, 'events'), 
        where('status', '==', 'published'),
        orderBy('date', 'asc'),
        limit(8)
      )
      statsListeners.push(onSnapshot(upcomingQuery, (snapshot) => {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setUpcomingEvents(events)
      }, (error) => console.error('Upcoming events listener error:', error)))

      // Testimonials
      const testimonialsQuery = query(collection(db, 'testimonials'), where('isPublished', '==', true), limit(3))
      statsListeners.push(onSnapshot(testimonialsQuery, (snapshot) => {
        setTestimonials(snapshot.docs.map(doc => doc.data()))
      }, (error) => console.error('Testimonials listener error:', error)))

      // Causes
      const causesQuery = query(collection(db, 'causes'), where('status', '==', 'active'), limit(3))
      statsListeners.push(onSnapshot(causesQuery, (snapshot) => {
        setCauses(snapshot.docs.map(doc => doc.data()))
      }, (error) => console.error('Causes listener error:', error)))

      // Sponsors
      const sponsorsQuery = query(collection(db, 'sponsors'), where('partnershipStatus', '==', 'active'), limit(6))
      statsListeners.push(onSnapshot(sponsorsQuery, (snapshot) => {
        setSponsors(snapshot.docs.map(doc => doc.data()))
      }, (error) => console.error('Sponsors listener error:', error)))

      // News
      const newsQuery = query(collection(db, 'news'), where('isPublished', '==', true), limit(3))
      statsListeners.push(onSnapshot(newsQuery, (snapshot) => {
        setNews(snapshot.docs.map(doc => doc.data()))
      }, (error) => console.error('News listener error:', error)))
    } catch (error) {
      console.error('Error setting up listeners:', error)
    }

    return () => {
      statsListeners.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  const pillars = [
    { icon: Users2, title: 'Community', desc: 'Connect & build relationships' },
    { icon: Heart, title: 'Welfare', desc: 'Support those in need' },
    { icon: Zap, title: 'Volunteering', desc: 'Make a difference with your time' },
    { icon: Building2, title: 'Business Network', desc: 'Grow with community support' },
    { icon: Briefcase, title: 'Partnerships', desc: 'Strategic collaborations' },
    { icon: BookOpen, title: 'Development', desc: 'Learn & grow together' },
  ]

  return (
    <div className="w-full bg-background text-foreground">
      <Navbar />

      <HomeHero />
      <HomeStatsBar />
      <PartnersMarquee />
      <HomeMission />

      {/* UPCOMING EVENTS - Enhanced with 4+ Cards, Responsive */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 bg-gradient-to-b from-white to-[#f7f6f2]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10 md:mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#111111]" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline">Upcoming Events</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#888888] mt-1">Join our community and participate in meaningful events</p>
            </div>
            <Link href="/events" className="flex-shrink-0">
              <Button size="sm" className="w-full sm:w-auto bg-[#111111] hover:bg-[#333333] text-white">
                View All Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Events Grid - 4+ Cards Responsive */}
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-[#e4e1da] mx-auto mb-4" />
              <p className="text-base sm:text-lg text-[#888888] font-medium">No upcoming events yet</p>
              <p className="text-xs sm:text-sm text-[#c0b5a8] mt-1">Check back soon for exciting events</p>
            </div>
          )}

          {/* View All Link */}
          {upcomingEvents.length >= 4 && (
            <div className="text-center mt-8 sm:mt-10">
              <Link href="/events">
                <Button variant="outline" className="bg-white border-[#111111] text-[#111111] hover:bg-[#f7f6f2]">
                  Explore All Events & Filters
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 6 PILLARS - Mobile First */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 bg-[#f7f6f2]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 font-headline">
            Our 6 Pillars
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon
              return (
                <div key={idx} className="bg-white p-4 sm:p-5 rounded-lg border border-[#e4e1da] hover:shadow-md transition-shadow">
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-[#111111] mb-2" />
                  <h3 className="font-bold text-base sm:text-lg mb-1">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-[#888888] leading-tight">{pillar.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS - Mobile First */}
      {testimonials.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 font-headline">
              Success Stories
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials.map((test) => (
                <div key={test.id} className="bg-white p-4 sm:p-5 rounded-lg border border-[#e4e1da]">
                  {test.image && (
                    <img src={test.image} alt={test.name} className="w-10 h-10 rounded-full mb-3 object-cover" />
                  )}
                  <p className="text-xs sm:text-sm text-[#333333] mb-2 italic line-clamp-3">{test.content}</p>
                  <p className="font-bold text-xs sm:text-sm">{test.name}</p>
                  <p className="text-xs text-[#888888]">{test.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ACTIVE CAUSES - Mobile First */}
      {causes.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 bg-[#f7f6f2]">
          <div className="max-w-6xl mx-auto">
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
                          <span className="text-[#888888]">of AED {(cause.goalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-[#e4e1da] rounded-full h-1.5">
                          <div className="bg-[#111111] h-1.5 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
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
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-headline">
              Our Partners & Sponsors
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {sponsors.map((sponsor) => (
                <div key={sponsor.id} className="bg-white p-4 sm:p-6 rounded-lg border border-[#e4e1da] flex items-center justify-center min-h-[120px]">
                  {sponsor.logo ? (
                    <img src={sponsor.logo} alt={sponsor.companyName} className="max-w-full max-h-12 object-contain" />
                  ) : (
                    <p className="text-xs sm:text-sm text-center font-bold text-[#333333]">{sponsor.companyName}</p>
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
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-headline">
              Latest News
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((article) => (
                <div key={article.id} className="bg-white rounded-lg overflow-hidden border border-[#e4e1da] hover:shadow-md transition-shadow">
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

      {/* YOUTUBE WIDGET - Latest Videos */}
      {youtubeConfig && youtubeConfig.videos.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
          <div className="max-w-6xl mx-auto">
            <YouTubeWidget videos={youtubeConfig.videos} />
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
