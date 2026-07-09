'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Heart, TrendingUp, Users2, Target, Award, BarChart3, PieChart, ArrowUpRight } from 'lucide-react'
import {
  subscribeToTransparencyConfig,
  DEFAULT_TRANSPARENCY_CONFIG,
  type TransparencyConfig,
} from '@/lib/transparency-config'
import type { PublicTransparencyCause } from '@/lib/public-transparency-stats-server'

type TransparencyStats = {
  totalDonations: number
  completedDonations: number
  totalBeneficiaries: number
  activeCauses: number
  totalVolunteers: number
  volunteerHours: number
}

const EMPTY_STATS: TransparencyStats = {
  totalDonations: 0,
  completedDonations: 0,
  totalBeneficiaries: 0,
  activeCauses: 0,
  totalVolunteers: 0,
  volunteerHours: 0,
}

export default function TransparencyPage() {
  const [copy, setCopy] = useState<TransparencyConfig>(DEFAULT_TRANSPARENCY_CONFIG)
  const [stats, setStats] = useState<TransparencyStats>(EMPTY_STATS)
  const [causes, setCauses] = useState<PublicTransparencyCause[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => subscribeToTransparencyConfig(setCopy), [])

  useEffect(() => {
    let cancelled = false

    const loadStats = async () => {
      try {
        const res = await fetch('/api/public/transparency-stats', { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled && json.success && json.data) {
          const data = json.data as TransparencyStats & { causes?: PublicTransparencyCause[] }
          setStats({
            totalDonations: data.totalDonations ?? 0,
            completedDonations: data.completedDonations ?? 0,
            totalBeneficiaries: data.totalBeneficiaries ?? 0,
            activeCauses: data.activeCauses ?? 0,
            totalVolunteers: data.totalVolunteers ?? 0,
            volunteerHours: data.volunteerHours ?? 0,
          })
          setCauses(Array.isArray(data.causes) ? data.causes : [])
        }
      } catch (error) {
        console.error('[transparency] Failed to load stats:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadStats()
    return () => {
      cancelled = true
    }
  }, [])

  const causeBreakdown = causes.map((cause) => ({
    name: cause.title,
    value: cause.currentAmount || 0,
    goal: cause.goalAmount || 0,
  }))

  const metrics = [
    {
      icon: Heart,
      label: 'Total Donations',
      value: `AED ${stats.totalDonations.toLocaleString()}`,
      subtext: `${stats.completedDonations} donations`,
      color: '#e74c3c',
    },
    {
      icon: Users2,
      label: 'Beneficiaries Helped',
      value: stats.totalBeneficiaries.toLocaleString(),
      subtext: 'Lives impacted',
      color: '#3498db',
    },
    {
      icon: Target,
      label: 'Active Causes',
      value: stats.activeCauses.toLocaleString(),
      subtext: 'Ongoing initiatives',
      color: '#27ae60',
    },
    {
      icon: Award,
      label: 'Volunteer Hours',
      value: stats.volunteerHours.toLocaleString(),
      subtext: `${stats.totalVolunteers} volunteers`,
      color: '#f39c12',
    },
  ]

  const getInvolvedIcons = [Heart, Users2, TrendingUp]

  return (
    <div className="w-full bg-background text-foreground">
      <Navbar />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline leading-tight mb-6">
                {copy.heroHeadline}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-4 leading-relaxed">
                {copy.heroSubheadline}
              </p>
              <p className="text-sm text-[#888888] leading-relaxed">{copy.heroTagline}</p>
            </div>
            <div className="bg-white p-8 rounded-lg border border-[#e4e1da]">
              <h3 className="text-xl font-bold mb-4 text-[#111111]">{copy.commitmentTitle}</h3>
              <p className="text-[#333333] leading-relaxed text-sm sm:text-base">{copy.commitmentBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 sm:mb-12 font-headline">{copy.metricsHeading}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, idx) => {
              const Icon = metric.icon
              return (
                <div
                  key={idx}
                  className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da] hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
                      <Icon className="h-6 w-6" style={{ color: metric.color }} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#27ae60]" />
                  </div>
                  <p className="text-[#888888] text-sm mb-2">{metric.label}</p>
                  <div className="text-2xl sm:text-3xl font-bold mb-1 text-[#111111]">
                    {loading ? '-' : metric.value}
                  </div>
                  <p className="text-xs sm:text-sm text-[#888888]">{metric.subtext}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 sm:mb-12 font-headline">{copy.causesHeading}</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">{copy.causesChartTitle}</h3>
                <BarChart3 className="h-5 w-5 text-[#3498db]" />
              </div>

              <div className="space-y-6">
                {causes.slice(0, 5).map((cause) => {
                  const goal = cause.goalAmount || 0
                  const percentage = goal > 0 ? (cause.currentAmount / goal) * 100 : 0
                  return (
                    <div key={cause.id}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-sm sm:text-base text-[#111111] line-clamp-2">
                          {cause.title}
                        </h4>
                        <span className="text-xs sm:text-sm font-bold text-[#3498db]">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#e4e1da] rounded-full h-3">
                        <div
                          className="bg-[#3498db] h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[#888888] mt-1">
                        <span>AED {(cause.currentAmount || 0).toLocaleString()}</span>
                        <span>of AED {goal.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
                {!loading && causes.length === 0 && (
                  <p className="text-sm text-[#888888]">No active causes to display yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
                <PieChart className="h-6 w-6 text-[#f39c12] mb-3" />
                <p className="text-[#888888] text-sm mb-2">Total Fundraised</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#111111] mb-4">
                  {loading ? '-' : `AED ${stats.totalDonations.toLocaleString()}`}
                </p>
                <div className="w-full bg-[#e4e1da] rounded-full h-2">
                  <div
                    className="bg-[#f39c12] h-2 rounded-full"
                    style={{
                      width: `${
                        causeBreakdown.reduce((sum, c) => sum + c.value, 0) /
                          (causeBreakdown.reduce((sum, c) => sum + c.goal, 0) || 1) *
                          100 || 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
                <TrendingUp className="h-6 w-6 text-[#27ae60] mb-3" />
                <p className="text-[#888888] text-sm mb-2">Causes Funded</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#111111]">
                  {causes.filter((c) => (c.goalAmount || 0) > 0 && c.currentAmount >= c.goalAmount).length} of{' '}
                  {causes.length}
                </p>
                <p className="text-xs text-[#888888] mt-2">Fully funded</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 sm:mb-12 font-headline">{copy.timelineHeading}</h2>

          <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center p-6 border-r border-[#e4e1da] last:border-r-0">
                <div className="h-12 w-12 rounded-full bg-[#e74c3c] bg-opacity-20 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-[#e74c3c]" />
                </div>
                <p className="text-[#888888] text-sm mb-2">This Month</p>
                <p className="text-2xl font-bold text-[#111111]">
                  AED {(stats.totalDonations * 0.3).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col items-center p-6 border-r border-[#e4e1da] last:border-r-0">
                <div className="h-12 w-12 rounded-full bg-[#3498db] bg-opacity-20 flex items-center justify-center mb-4">
                  <Users2 className="h-6 w-6 text-[#3498db]" />
                </div>
                <p className="text-[#888888] text-sm mb-2">This Quarter</p>
                <p className="text-2xl font-bold text-[#111111]">
                  AED {(stats.totalDonations * 0.7).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col items-center p-6">
                <div className="h-12 w-12 rounded-full bg-[#27ae60] bg-opacity-20 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-[#27ae60]" />
                </div>
                <p className="text-[#888888] text-sm mb-2">Year-to-Date</p>
                <p className="text-2xl font-bold text-[#111111]">AED {stats.totalDonations.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-[#111111]">{copy.privacyHeading}</h3>
              <p className="text-sm sm:text-base text-[#333333]">{copy.privacyBody}</p>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
              <ul className="list-disc list-inside space-y-3 text-sm sm:text-base text-[#666666]">
                {copy.privacyBullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>

              <p className="text-[#888888] text-sm mt-6 pt-6 border-t border-[#e4e1da]">
                Questions about our transparency? Contact our team at{' '}
                <a
                  href={`mailto:${copy.contactEmail}`}
                  className="text-[#3498db] hover:underline break-all"
                >
                  {copy.contactEmail}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 font-headline leading-tight">
                {copy.ctaHeading}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">{copy.ctaBody}</p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={copy.donateHref}>
                  <Button size="lg" className="bg-[#111111] hover:bg-[#333333] text-white w-full sm:w-auto">
                    {copy.donateLabel}
                  </Button>
                </Link>
                <Link href={copy.joinHref}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    {copy.joinLabel}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-[#f7f6f2] p-8 rounded-lg border border-[#e4e1da]">
              <h3 className="text-lg font-bold mb-6 text-[#111111]">{copy.getInvolvedTitle}</h3>
              <div className="space-y-4">
                {copy.getInvolvedItems.map((item, index) => {
                  const Icon = getInvolvedIcons[index] || Heart
                  const colors = ['#e74c3c', '#3498db', '#27ae60']
                  const color = colors[index] || '#111111'
                  return (
                    <div key={item.title} className="flex gap-4">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#111111] mb-1">{item.title}</h4>
                        <p className="text-sm text-[#666666]">{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
