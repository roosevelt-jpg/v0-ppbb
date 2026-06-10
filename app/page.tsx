'use client'

import React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Logo } from '@/components/logo'
import { Card } from '@/components/ui/card'
import { ArrowRight, Users, Calendar, Heart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f6f2', color: '#111111' }}>
      {/* Navigation */}
      <Navbar />

      {/* Hero section */}
      <section className="py-16 px-6" style={{ backgroundColor: '#f7f6f2' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              fontFamily: 'Playfair Display',
              color: '#111111',
              letterSpacing: '-0.3px',
            }}
          >
            Community platform for events, volunteering, and giving
          </h1>
          <p className="text-base mb-8" style={{ color: '#888888' }}>
            Passive Blessings connects members with opportunities to volunteer, contribute, and support their community.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="px-6 py-2 rounded-lg text-sm font-medium transition"
              style={{
                backgroundColor: '#111111',
                color: '#f7f6f2',
              }}
            >
              Get started
            </Link>
            <Link
              href="#learn-more"
              className="px-6 py-2 rounded-lg text-sm font-medium border transition"
              style={{
                borderColor: '#e4e1da',
                color: '#111111',
              }}
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Users, label: 'Members', value: '3,412' },
            { icon: Calendar, label: 'Events', value: '87' },
            { icon: Heart, label: 'Donations', value: 'AED 92K' },
          ].map((stat, idx) => (
            <Card key={idx} className="p-6 text-center" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
              <stat.icon className="w-8 h-8 mx-auto mb-3" style={{ color: '#111111' }} />
              <p className="text-sm" style={{ color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold mt-2" style={{ color: '#111111', fontFamily: 'Playfair Display' }}>
                {stat.value}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl font-bold text-center mb-12"
            style={{
              fontFamily: 'Playfair Display',
              color: '#111111',
            }}
          >
            How it works
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Join the community',
                description: 'Sign up and create your profile with your interests and availability.',
              },
              {
                title: 'Browse opportunities',
                description: 'Explore events, volunteer roles, and ways to support your community.',
              },
              {
                title: 'Connect & contribute',
                description: 'Participate in events and make meaningful connections with members.',
              },
              {
                title: 'Track your impact',
                description: 'See your volunteer hours, donations, and community contributions.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-lg border" style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#111111' }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: '#888888' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-12 px-6">
        <div
          className="rounded-lg p-12 text-center"
          style={{
            backgroundColor: '#111111',
            color: '#f7f6f2',
          }}
        >
          <h2
            className="text-2xl font-bold mb-4"
            style={{
              fontFamily: 'Playfair Display',
              color: '#f7f6f2',
            }}
          >
            Ready to make a difference?
          </h2>
          <p className="text-sm mb-6" style={{ color: '#e4e1da' }}>
            Join thousands of community members creating positive impact.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition"
            style={{
              backgroundColor: '#f7f6f2',
              color: '#111111',
            }}
          >
            Join now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
