'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { HeroSlider } from '@/components/hero-slider'
import { YouTubeWidget } from '@/components/youtube-widget'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users2, Heart, Zap, Building2, BookOpen, Briefcase, TrendingUp } from 'lucide-react'
import { getHeroSliderSettings } from '@/lib/hero-slider'
import { getYouTubeConfig } from '@/lib/youtube-service'
import { HeroSliderSettings, YouTubeConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const [stats, setStats] = useState({ members: 0, events: 0, donations: 0 })
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [causes, setCauses] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [heroSliderSettings, setHeroSliderSettings] = useState<HeroSliderSettings | null>(null)
  const [youtubeConfig, setYoutubeConfig] = useState<YouTubeConfig | null>(null)

  useEffect(() => {
    const statsListeners: any[] = []
    
    try {
      // Load hero slider settings
      getHeroSliderSettings().then(setHeroSliderSettings).catch(err => console.error('Hero slider error:', err))
      
      // Load YouTube config
      getYouTubeConfig().then(setYoutubeConfig).catch(err => console.error('YouTube config error:', err))

      // Members count
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'member'))
      statsListeners.push(onSnapshot(usersQuery, (snapshot) => {
        setStats((prev) => ({ ...prev, members: snapshot.docs.length }))
      }, (error) => console.error('Members listener error:', error)))

      // Events count
      const eventsQuery = query(collection(db, 'events'), where('status', '==', 'published'))
      statsListeners.push(onSnapshot(eventsQuery, (snapshot) => {
        setStats((prev) => ({ ...prev, events: snapshot.docs.length }))
      }, (error) => console.error('Events listener error:', error)))

      // Donations sum
      const donationsQuery = query(collection(db, 'donations'), where('status', '==', 'completed'))
      statsListeners.push(onSnapshot(donationsQuery, (snapshot) => {
        const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)
        setStats((prev) => ({ ...prev, donations: total }))
      }, (error) => console.error('Donations listener error:', error)))

      // Upcoming events
      const upcomingQuery = query(collection(db, 'events'), where('status', 'in', ['published', 'active']), limit(3))
      statsListeners.push(onSnapshot(upcomingQuery, (snapshot) => {
        setUpcomingEvents(snapshot.docs.map(doc => doc.data()))
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

      setLoading(false)
    } catch (error) {
      console.error('Error setting up listeners:', error)
      setLoading(false)
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

      {/* HERO SLIDER - Full Width Image Carousel */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <HeroSlider settings={heroSliderSettings} />
        </div>
      </section>

      {/* HERO SECTION - Mobile First */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col items-center justify-center text-center w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-playfair leading-tight sm:leading-snug md:leading-tight mb-6 sm:mb-8 md:mb-10 max-w-4xl">
              Community. Support. Growth.
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed text-balance">
              Connect with members, volunteer your time, donate to causes, and grow your business within our thriving community platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-[#111111] hover:bg-[#333333] text-white">
                  Join Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/donate" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-[#111111] hover:bg-[#333333] text-white">
                  Donate Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT SECTION - Mobile First Grid */}
      <section id="impact" className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-playfair">
            Our Impact
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex flex-col items-center p-6 sm:p-8 bg-white rounded-lg border border-[#e4e1da]">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111111] mb-2">
                {loading ? '-' : stats.members.toLocaleString()}
              </div>
              <p className="text-sm sm:text-base text-[#888888] text-center">Active Members</p>
            </div>
            
            <div className="flex flex-col items-center p-6 sm:p-8 bg-white rounded-lg border border-[#e4e1da]">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111111] mb-2">
                {loading ? '-' : stats.events.toLocaleString()}
              </div>
              <p className="text-sm sm:text-base text-[#888888] text-center">Events Hosted</p>
            </div>
            
            <div className="flex flex-col items-center p-6 sm:p-8 bg-white rounded-lg border border-[#e4e1da]">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111111] mb-2">
                {loading ? '-' : `AED ${(stats.donations / 1000).toFixed(1)}K`}
              </div>
              <p className="text-sm sm:text-base text-[#888888] text-center">Donations Raised</p>
            </div>
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS - Mobile First */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-playfair">Upcoming Events</h2>
            <Link href="/events">
              <Button size="sm" className="w-full sm:w-auto bg-[#111111] hover:bg-[#333333] text-white">
                View All Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white border border-[#e4e1da] rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {event.image && (
                  <img src={event.image} alt={event.title} className="w-full h-40 sm:h-48 object-cover" />
                )}
                <div className="p-4 sm:p-6">
                  <h3 className="font-bold text-lg sm:text-xl mb-2 line-clamp-2">{event.title}</h3>
                  <p className="text-xs sm:text-sm text-[#888888] mb-3">{event.location}</p>
                  <Link href={`/dashboard/events/${event.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 PILLARS - Mobile First */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-playfair">
            Our 6 Pillars
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon
              return (
                <div key={idx} className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da] hover:shadow-md transition-shadow">
                  <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-[#111111] mb-4" />
                  <h3 className="font-bold text-lg sm:text-xl mb-2">{pillar.title}</h3>
                  <p className="text-sm sm:text-base text-[#888888]">{pillar.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS - Mobile First */}
      {testimonials.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-playfair">
              Success Stories
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((test) => (
                <div key={test.id} className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
                  {test.image && (
                    <img src={test.image} alt={test.name} className="w-12 h-12 rounded-full mb-4 object-cover" />
                  )}
                  <p className="text-sm sm:text-base text-[#333333] mb-4 italic line-clamp-3">{test.content}</p>
                  <p className="font-bold text-sm sm:text-base">{test.name}</p>
                  <p className="text-xs sm:text-sm text-[#888888]">{test.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ACTIVE CAUSES - Mobile First */}
      {causes.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-playfair">
              Active Causes
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {causes.map((cause) => {
                const percentage = (cause.currentAmount / cause.goalAmount) * 100
                return (
                  <div key={cause.id} className="bg-white rounded-lg overflow-hidden border border-[#e4e1da]">
                    {cause.image && (
                      <img src={cause.image} alt={cause.title} className="w-full h-40 sm:h-48 object-cover" />
                    )}
                    <div className="p-4 sm:p-6">
                      <h3 className="font-bold text-lg sm:text-xl mb-2">{cause.title}</h3>
                      <p className="text-xs sm:text-sm text-[#888888] mb-4">{cause.description}</p>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-xs sm:text-sm mb-2">
                          <span>AED {(cause.currentAmount || 0).toLocaleString()}</span>
                          <span className="text-[#888888]">of AED {(cause.goalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-[#e4e1da] rounded-full h-2">
                          <div className="bg-[#111111] h-2 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                        </div>
                      </div>
                      
                      <Link href="/donate">
                        <Button size="sm" className="w-full bg-[#111111] hover:bg-[#333333] text-white">
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-playfair">
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12 md:mb-16 font-playfair">
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
