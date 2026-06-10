'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Logo } from '@/components/logo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Calendar, Heart, Zap, TrendingUp, Award, Users2, Briefcase, Target, Building2, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const [stats, setStats] = useState({ members: 0, events: 0, donations: 0 })
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [causes, setCauses] = useState<any[]>([])
  const [sponsors, setSponsors] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch live stats
    const statsListeners = []

    // Members count
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'member'))
    statsListeners.push(onSnapshot(usersQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, members: snapshot.docs.length }))
    }))

    // Events count
    const eventsQuery = query(collection(db, 'events'), where('status', '==', 'published'))
    statsListeners.push(onSnapshot(eventsQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, events: snapshot.docs.length }))
    }))

    // Donations sum
    const donationsQuery = query(collection(db, 'donations'), where('status', '==', 'completed'))
    statsListeners.push(onSnapshot(donationsQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)
      setStats((prev) => ({ ...prev, donations: total }))
    }))

    // Upcoming events (limit 3)
    const upcomingQuery = query(
      collection(db, 'events'),
      where('status', 'in', ['published', 'active']),
      limit(3)
    )
    statsListeners.push(onSnapshot(upcomingQuery, (snapshot) => {
      setUpcomingEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }))

    // Testimonials (limit 3)
    const testimonialsQuery = query(
      collection(db, 'testimonials'),
      where('isPublished', '==', true),
      limit(3)
    )
    statsListeners.push(onSnapshot(testimonialsQuery, (snapshot) => {
      setTestimonials(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }))

    // Active causes (limit 3)
    const causesQuery = query(
      collection(db, 'causes'),
      where('status', '==', 'active'),
      limit(3)
    )
    statsListeners.push(onSnapshot(causesQuery, (snapshot) => {
      setCauses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }))

    // Sponsors (limit 6)
    const sponsorsQuery = query(
      collection(db, 'sponsors'),
      where('partnershipStatus', '==', 'active'),
      limit(6)
    )
    statsListeners.push(onSnapshot(sponsorsQuery, (snapshot) => {
      setSponsors(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }))

    // News (limit 3)
    const newsQuery = query(
      collection(db, 'news'),
      where('isPublished', '==', true),
      limit(3)
    )
    statsListeners.push(onSnapshot(newsQuery, (snapshot) => {
      setNews(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }))

    setLoading(false)

    return () => statsListeners.forEach((unsub) => unsub?.())
  }, [])

  const pillars = [
    { id: 'community', title: 'Community', description: 'Connect with members and build strong relationships', icon: Users2 },
    { id: 'welfare', title: 'Welfare', description: 'Support those in need through charitable initiatives', icon: Heart },
    { id: 'volunteering', title: 'Volunteering', description: 'Make a difference with your time and skills', icon: Zap },
    { id: 'business', title: 'Business Network', description: 'Grow your business with community support', icon: Building2 },
    { id: 'partnerships', title: 'Partnerships', description: 'Strategic collaborations for greater impact', icon: Briefcase },
    { id: 'development', title: 'Personal Development', description: 'Learn and grow through community programs', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f6f2', color: '#111111' }}>
      {/* Navigation */}
      <Navbar />

      {/* Hero section */}
      <section className="py-20 px-6" style={{ backgroundColor: '#f7f6f2' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Playfair Display', color: '#111111' }}>
            Community platform for events, volunteering, and giving
          </h1>
          <p className="text-lg mb-10" style={{ color: '#888888' }}>
            Passive Blessings connects members with opportunities to volunteer, contribute, and support their community through meaningful action.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="px-6 py-3 rounded-lg font-medium transition" style={{ backgroundColor: '#111111', color: '#f7f6f2' }}>
              Join Community
            </Link>
            <Link href="/dashboard/donations" className="px-6 py-3 rounded-lg font-medium transition border" style={{ borderColor: '#e4e1da', color: '#111111' }}>
              Donate Now
            </Link>
            <Link href="/dashboard/volunteering" className="px-6 py-3 rounded-lg font-medium transition border" style={{ borderColor: '#e4e1da', color: '#111111' }}>
              Volunteer
            </Link>
            <Link href="/dashboard/sponsor-profile" className="px-6 py-3 rounded-lg font-medium transition border" style={{ borderColor: '#e4e1da', color: '#111111' }}>
              Partner With Us
            </Link>
          </div>
        </div>
      </section>

      {/* Impact metrics section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <Card className="p-8 text-center" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
            <Users className="w-10 h-10 mx-auto mb-4" style={{ color: '#111111' }} />
            <p className="text-sm mb-2" style={{ color: '#888888', textTransform: 'uppercase' }}>Active Members</p>
            <p className="text-3xl font-bold" style={{ color: '#111111', fontFamily: 'Playfair Display' }}>{stats.members.toLocaleString()}</p>
          </Card>
          <Card className="p-8 text-center" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
            <Calendar className="w-10 h-10 mx-auto mb-4" style={{ color: '#111111' }} />
            <p className="text-sm mb-2" style={{ color: '#888888', textTransform: 'uppercase' }}>Events Held</p>
            <p className="text-3xl font-bold" style={{ color: '#111111', fontFamily: 'Playfair Display' }}>{stats.events.toLocaleString()}</p>
          </Card>
          <Card className="p-8 text-center" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
            <Heart className="w-10 h-10 mx-auto mb-4" style={{ color: '#111111' }} />
            <p className="text-sm mb-2" style={{ color: '#888888', textTransform: 'uppercase' }}>Donated</p>
            <p className="text-3xl font-bold" style={{ color: '#111111', fontFamily: 'Playfair Display' }}>AED {(stats.donations / 1000).toFixed(0)}K</p>
          </Card>
        </div>
      </section>

      {/* 6 Pillars section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16" style={{ fontFamily: 'Playfair Display', color: '#111111' }}>
            Our 6 Pillars
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map((pillar) => {
              const Icon = pillar.icon
              return (
                <Card key={pillar.id} className="p-8 hover:shadow-lg transition" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
                  <Icon className="w-12 h-12 mb-4" style={{ color: '#111111' }} />
                  <h3 className="text-xl font-bold mb-3" style={{ color: '#111111' }}>
                    {pillar.title}
                  </h3>
                  <p style={{ color: '#888888' }}>{pillar.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Upcoming events section */}
      {upcomingEvents.length > 0 && (
        <section className="py-20 px-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12" style={{ fontFamily: 'Playfair Display', color: '#111111' }}>
              Upcoming Events
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
                  {event.imageUrl && (
                    <div className="h-40 bg-gray-200 overflow-hidden">
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold mb-2" style={{ color: '#111111' }}>
                      {event.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: '#888888' }}>
                      {event.date} • {event.location}
                    </p>
                    <Link href={`/dashboard/events#${event.id}`} className="text-sm font-medium" style={{ color: '#111111' }}>
                      Learn More →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/dashboard/events" className="px-6 py-3 rounded-lg font-medium transition" style={{ backgroundColor: '#111111', color: '#f7f6f2' }}>
                View All Events
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials section */}
      {testimonials.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Playfair Display', color: '#111111' }}>
              Member Stories
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="p-8" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
                  <div className="flex items-center mb-4">
                    {testimonial.image && (
                      <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                    )}
                    <div>
                      <p className="font-bold" style={{ color: '#111111' }}>
                        {testimonial.name}
                      </p>
                      <p className="text-sm" style={{ color: '#888888' }}>
                        {testimonial.title}
                      </p>
                    </div>
                  </div>
                  <p className="italic" style={{ color: '#333333' }}>
                    "{testimonial.content}"
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Active causes section */}
      {causes.length > 0 && (
        <section className="py-20 px-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12" style={{ fontFamily: 'Playfair Display', color: '#111111' }}>
              Active Causes
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {causes.map((cause) => (
                <Card key={cause.id} className="overflow-hidden hover:shadow-lg transition" style={{ backgroundColor: '#f7f6f2', borderColor: '#e4e1da' }}>
                  {cause.image && (
                    <div className="h-40 bg-gray-200 overflow-hidden">
                      <img src={cause.image} alt={cause.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold mb-2" style={{ color: '#111111' }}>
                      {cause.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: '#888888' }}>
                      {cause.description}
                    </p>
                    <div className="bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min((cause.currentAmount / cause.goalAmount) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: '#888888' }}>
                      AED {cause.currentAmount.toLocaleString()} / AED {cause.goalAmount.toLocaleString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/dashboard/donations" className="px-6 py-3 rounded-lg font-medium transition" style={{ backgroundColor: '#111111', color: '#f7f6f2' }}>
                Support a Cause
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* News & Media section */}
      {news.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12" style={{ fontFamily: 'Playfair Display', color: '#111111' }}>
              Latest News
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {news.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
                  {article.image && (
                    <div className="h-40 bg-gray-200 overflow-hidden">
                      <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-xs mb-2" style={{ color: '#888888', textTransform: 'uppercase' }}>
                      {article.category}
                    </p>
                    <h3 className="font-bold mb-2" style={{ color: '#111111' }}>
                      {article.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: '#888888' }}>
                      {article.summary}
                    </p>
                    <p className="text-xs" style={{ color: '#888888' }}>
                      By {article.author}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sponsors & Partners section */}
      {sponsors.length > 0 && (
        <section className="py-20 px-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Playfair Display', color: '#111111' }}>
              Our Partners & Sponsors
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {sponsors.map((sponsor) => (
                <Card key={sponsor.id} className="p-8 flex items-center justify-center" style={{ backgroundColor: '#f7f6f2', borderColor: '#e4e1da', minHeight: '150px' }}>
                  {sponsor.logo ? (
                    <img src={sponsor.logo} alt={sponsor.companyName} className="max-h-20 max-w-full" />
                  ) : (
                    <p className="font-bold text-center" style={{ color: '#111111' }}>
                      {sponsor.companyName}
                    </p>
                  )}
                </Card>
              ))}
            </div>
            <div className="text-center">
              <Link href="/dashboard/sponsor-profile" className="px-6 py-3 rounded-lg font-medium transition" style={{ backgroundColor: '#111111', color: '#f7f6f2' }}>
                Become a Partner
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA section */}
      <section className="py-16 px-6">
        <div className="rounded-lg p-16 text-center" style={{ backgroundColor: '#111111', color: '#f7f6f2' }}>
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Playfair Display', color: '#f7f6f2' }}>
            Ready to make a difference?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#e4e1da' }}>
            Join thousands of community members creating positive impact today.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition" style={{ backgroundColor: '#f7f6f2', color: '#111111' }}>
            Join Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
