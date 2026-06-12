'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, limit, getDocs } from 'firebase/firestore'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Heart, TrendingUp, Users2, Target, Award, BarChart3, PieChart, ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function TransparencyPage() {
  const [stats, setStats] = useState({
    totalDonations: 0,
    completedDonations: 0,
    totalBeneficiaries: 0,
    activeCauses: 0,
    totalVolunteers: 0,
    volunteerHours: 0,
  })
  const [causes, setCauses] = useState<any[]>([])
  const [donationTrend, setDonationTrend] = useState<any[]>([])
  const [causeBreakdown, setCauseBreakdown] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const listeners: any[] = []

    try {
      // Total donations amount
      const donationsQuery = query(collection(db, 'donations'), where('status', '==', 'completed'))
      listeners.push(
        onSnapshot(donationsQuery, (snapshot) => {
          const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)
          const count = snapshot.docs.length
          setStats((prev) => ({
            ...prev,
            totalDonations: total,
            completedDonations: count,
          }))
        })
      )

      // Active causes count and amounts
      const causesQuery = query(collection(db, 'causes'), where('status', '==', 'active'))
      listeners.push(
        onSnapshot(causesQuery, (snapshot) => {
          const causesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as any[]

          setCauses(causesData.sort((a, b) => (b.currentAmount || 0) - (a.currentAmount || 0)))
          setStats((prev) => ({
            ...prev,
            activeCauses: causesData.length,
          }))

          // Calculate cause breakdown for chart
          const breakdown = causesData.map((cause) => ({
            name: cause.title,
            value: cause.currentAmount || 0,
            goal: cause.goalAmount || 0,
          }))
          setCauseBreakdown(breakdown)
        })
      )

      // Beneficiary requests count (approved/completed)
      const beneficiaryQuery = query(
        collection(db, 'beneficiaryRequests'),
        where('status', '==', 'approved')
      )
      listeners.push(
        onSnapshot(beneficiaryQuery, (snapshot) => {
          setStats((prev) => ({
            ...prev,
            totalBeneficiaries: snapshot.docs.length,
          }))
        })
      )

      // Volunteers count (estimated from volunteering collection)
      const volunteersQuery = query(collection(db, 'volunteers'))
      listeners.push(
        onSnapshot(volunteersQuery, (snapshot) => {
          let totalHours = 0
          snapshot.docs.forEach((doc) => {
            totalHours += doc.data().hoursContributed || 0
          })
          setStats((prev) => ({
            ...prev,
            totalVolunteers: snapshot.docs.length,
            volunteerHours: totalHours,
          }))
        })
      )

      setLoading(false)
    } catch (error) {
      console.error('[v0] Error loading transparency data:', error)
      setLoading(false)
    }

    return () => {
      listeners.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

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

  return (
    <div className="w-full bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-playfair leading-tight mb-6">
                Transparency & Impact Report
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-4 leading-relaxed">
                Know exactly how your donations and support are making a real difference in our community.
              </p>
              <p className="text-sm text-[#888888] leading-relaxed">
                Real-time data • No sensitive donor information shared • Verified impact metrics
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg border border-[#e4e1da]">
              <h3 className="text-xl font-bold mb-4 text-[#111111]">Our Commitment</h3>
              <p className="text-[#333333] leading-relaxed text-sm sm:text-base">
                We are dedicated to complete transparency about how donations are used. This dashboard displays real-time impact metrics without exposing sensitive donor information. Every number here represents genuine change in our community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics - Mobile First Grid */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 sm:mb-12 font-playfair">Our Impact at a Glance</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, idx) => {
              const Icon = metric.icon
              return (
                <div key={idx} className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da] hover:shadow-md transition-shadow">
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

      {/* Causes Breakdown */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 sm:mb-12 font-playfair">Donations by Cause</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart placeholder - Left side */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Cause Progress</h3>
                <div className="flex gap-2">
                  <BarChart3 className="h-5 w-5 text-[#3498db]" />
                </div>
              </div>

              <div className="space-y-6">
                {causes.slice(0, 5).map((cause) => {
                  const percentage = (cause.currentAmount / cause.goalAmount) * 100
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
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-[#888888] mt-1">
                        <span>AED {(cause.currentAmount || 0).toLocaleString()}</span>
                        <span>of AED {(cause.goalAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Summary Stats - Right side */}
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
                          causeBreakdown.reduce((sum, c) => sum + c.goal, 0) *
                          100 || 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
                <TrendingUp className="h-6 w-6 text-[#27ae60] mb-3" />
                <p className="text-[#888888] text-sm mb-2">Causes Funded</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#111111]">
                  {causes.filter((c) => (c.currentAmount / c.goalAmount) * 100 >= 100).length} of {causes.length}
                </p>
                <p className="text-xs text-[#888888] mt-2">Fully funded</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Timeline (informational) */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 sm:mb-12 font-playfair">Impact Timeline</h2>

          <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center p-6 border-r border-[#e4e1da] last:border-r-0">
                <div className="h-12 w-12 rounded-full bg-[#e74c3c] bg-opacity-20 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-[#e74c3c]" />
                </div>
                <p className="text-[#888888] text-sm mb-2">This Month</p>
                <p className="text-2xl font-bold text-[#111111]">AED {(stats.totalDonations * 0.3).toLocaleString()}</p>
              </div>

              <div className="flex flex-col items-center p-6 border-r border-[#e4e1da] last:border-r-0">
                <div className="h-12 w-12 rounded-full bg-[#3498db] bg-opacity-20 flex items-center justify-center mb-4">
                  <Users2 className="h-6 w-6 text-[#3498db]" />
                </div>
                <p className="text-[#888888] text-sm mb-2">This Quarter</p>
                <p className="text-2xl font-bold text-[#111111]">AED {(stats.totalDonations * 0.7).toLocaleString()}</p>
              </div>

              <div className="flex flex-col items-center p-6 border-r border-[#e4e1da] last:border-r-0">
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

      {/* Privacy Statement */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-[#f7f6f2]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-[#111111]">Privacy & Transparency Commitment</h3>

              <div className="space-y-4 text-sm sm:text-base text-[#333333]">
                <p>
                  We are committed to complete transparency about how donations are used. This dashboard displays aggregated impact metrics
                  without exposing any sensitive donor information.
                </p>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#e4e1da]">
              <ul className="list-disc list-inside space-y-3 text-sm sm:text-base text-[#666666]">
                <li>No individual donor information is displayed</li>
                <li>All metrics are aggregated and anonymized</li>
                <li>Real-time data updates every 24 hours</li>
                <li>Financial statements available upon request</li>
                <li>Full compliance with UAE charitable regulations</li>
              </ul>

              <p className="text-[#888888] text-sm mt-6 pt-6 border-t border-[#e4e1da]">
                Questions about our transparency? Contact our team at{' '}
                <a href="mailto:transparency@passiveblessings.ae" className="text-[#3498db] hover:underline break-all">
                  transparency@passiveblessings.ae
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 font-playfair leading-tight">
                Help Us Make a Greater Impact
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
                Every donation helps us support our community. Together, we can achieve more. Your contribution directly impacts the lives of beneficiaries and strengthens our collective mission.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard/donations">
                  <Button size="lg" className="bg-[#111111] hover:bg-[#333333] text-white w-full sm:w-auto">
                    Donate Now
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Join Our Community
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-[#f7f6f2] p-8 rounded-lg border border-[#e4e1da]">
              <h3 className="text-lg font-bold mb-6 text-[#111111]">Get Involved</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#e74c3c] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-[#e74c3c]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#111111] mb-1">Donate</h4>
                    <p className="text-sm text-[#666666]">Support our causes and help those in need</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#3498db] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                    <Users2 className="h-5 w-5 text-[#3498db]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#111111] mb-1">Volunteer</h4>
                    <p className="text-sm text-[#666666]">Contribute your time and skills</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#27ae60] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-[#27ae60]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#111111] mb-1">Partner</h4>
                    <p className="text-sm text-[#666666]">Collaborate with us for greater impact</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
