'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Mail, Globe, Link as LinkIcon, Share2, MessageCircle } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  image?: string
  email?: string
  social?: {
    linkedin?: string
    twitter?: string
    instagram?: string
    website?: string
  }
  order: number
}

export default function AboutPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [aboutContent, setAboutContent] = useState({
    title: 'About Passive Blessings',
    mission: 'Our mission is to build a thriving community platform that empowers individuals, businesses, and organizations to make a meaningful impact through collective action.',
    vision: 'A world where compassion, collaboration, and charitable action drive sustainable community development.',
  })

  useEffect(() => {
    // Fetch team members from API
    const loadTeamMembers = async () => {
      try {
        const res = await fetch('/api/team?status=published', { cache: 'no-store' })
        const json = await res.json()
        if (json.success) {
          setTeamMembers(json.data)
        }
      } catch (error) {
        console.error('[v0] Error loading team members:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadTeamMembers()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 bg-[#f7f6f2]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-playfair mb-4 leading-tight">
                About Us
              </h1>
              <p className="text-sm sm:text-base text-[#333333] leading-relaxed">
                Passive Blessings is a community platform dedicated to fostering meaningful connections, enabling charitable impact, and supporting business growth within the UAE.
              </p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-[#e4e1da]">
              <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                Our platform brings together individuals, businesses, and organizations to create lasting positive change. We believe in the power of community, collaboration, and compassion to solve challenges and drive sustainable development across the Emirates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Mission */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-playfair mb-3">Our Mission</h2>
              <p className="text-sm sm:text-base text-[#333333] leading-relaxed">
                {aboutContent.mission}
              </p>
            </div>

            {/* Vision */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-playfair mb-3">Our Vision</h2>
              <p className="text-sm sm:text-base text-[#333333] leading-relaxed">
                {aboutContent.vision}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 bg-[#f7f6f2]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold font-playfair text-center mb-8 sm:mb-10">
            Our Values
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                title: 'Community First',
                description: 'Building strong, inclusive communities where every voice matters',
              },
              {
                title: 'Integrity',
                description: 'Operating with transparency, honesty, and accountability',
              },
              {
                title: 'Impact',
                description: 'Creating measurable positive change in society',
              },
              {
                title: 'Collaboration',
                description: 'Working together across differences to achieve shared goals',
              },
              {
                title: 'Empowerment',
                description: 'Enabling individuals and businesses to reach their potential',
              },
              {
                title: 'Sustainability',
                description: 'Building long-term solutions for community challenges',
              },
            ].map((value, idx) => (
              <div key={idx} className="bg-white p-4 sm:p-5 rounded-lg border border-[#e4e1da] hover:shadow-lg transition-shadow">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-[#111111]">{value.title}</h3>
                <p className="text-xs sm:text-sm text-[#333333]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold font-playfair text-center mb-8 sm:mb-10">
            Meet Our Team
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-[#888888] text-sm">Loading team members...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#888888] text-sm">No team members to display yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-lg border border-[#e4e1da] overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Member Image */}
                  {member.image && (
                    <div className="w-full h-40 sm:h-48 overflow-hidden bg-[#f7f6f2]">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Member Info */}
                  <div className="p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-bold text-[#111111] mb-1">
                      {member.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[#b8860b] mb-2">
                      {member.role}
                    </p>
                    <p className="text-xs sm:text-sm text-[#333333] mb-3 line-clamp-2">
                      {member.bio}
                    </p>

                    {/* Social Links */}
                    {member.social && (
                      <div className="flex items-center gap-2 pt-3 border-t border-[#e4e1da]">
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            aria-label="Email"
                            className="text-[#888888] hover:text-[#111111] transition-colors"
                          >
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                          </a>
                        )}
                        {member.social.website && (
                          <a
                            href={member.social.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Website"
                            className="text-[#888888] hover:text-[#111111] transition-colors"
                          >
                            <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                          </a>
                        )}
                        {member.social.linkedin && (
                          <a
                            href={member.social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="text-[#888888] hover:text-[#111111] transition-colors"
                          >
                            <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
