'use client'

import React from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AboutHero } from '@/components/about/about-hero'
import { AboutStory } from '@/components/about/about-story'
import { AboutMissionVision } from '@/components/about/about-mission-vision'
import { AboutValues } from '@/components/about/about-values'
import { AboutTeam } from '@/components/about/about-team'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <AboutHero />
      <AboutStory />
      <AboutMissionVision />
      <AboutValues />
      <AboutTeam />
      <Footer />
    </div>
  )
}
