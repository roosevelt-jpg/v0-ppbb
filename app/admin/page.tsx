'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Users, Calendar, TrendingUp, AlertCircle, Heart, Clock, Building2, Target, User2, DollarSign, CheckCircle, AlertTriangle, Zap, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function AdminOverview() {
  const [stats, setStats] = React.useState({
    totalMembers: 0,
    totalVolunteers: 0,
    volunteerHours: 0,
    totalDonations: 0,
    totalDonationAmount: 0,
    activeEvents: 0,
    eventAttendance: 0,
    activeBusinesses: 0,
    charityRequests: 0,
    beneficiaryRequests: 0,
    pendingApprovals: 0,
    membershipTiers: { standard: 0, gold: 0, platinum: 0 },
    outreachPipeline: 0,
    donationApprovals: 0,
    conversionRate: 0,
    sponsorCount: 0,
    avgDonationAmount: 0,
    newMembersThisMonth: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all members
        const membersSnap = await getDocs(collection(db, 'users'))
        const members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        
        // Fetch volunteers
        const volunteersSnap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'volunteer'))
        )
        
        // Calculate volunteer hours
        let volunteerHours = 0
        members.forEach(m => {
          volunteerHours += m.volunteeredHours || 0
        })

        // Fetch donations
        const donationsSnap = await getDocs(collection(db, 'donations'))
        const donations = donationsSnap.docs.map(d => d.data())
        const completedDonations = donations.filter(d => d.status === 'completed')
        let totalDonationAmount = 0
        completedDonations.forEach(d => {
          totalDonationAmount += d.amount || 0
        })
        const avgDonationAmount = completedDonations.length > 0 ? Math.round(totalDonationAmount / completedDonations.length) : 0

        // Fetch events and attendance
        const eventsSnap = await getDocs(
          query(collection(db, 'events'), where('status', '!=', 'cancelled'))
        )
        const events = eventsSnap.docs.map(d => d.data())
        let eventAttendance = 0
        events.forEach(e => {
          eventAttendance += e.attendees?.length || 0
        })

        // Fetch businesses
        const businessesSnap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'business'))
        )

        // Fetch charity requests
        const charitySnap = await getDocs(collection(db, 'charityRequests'))

        // Fetch beneficiary requests
        const beneficiarySnap = await getDocs(collection(db, 'beneficiaryRequests'))

        // Fetch approvals
        const eventsApprovalsSnap = await getDocs(
          query(collection(db, 'events'), where('status', '==', 'pending'))
        )
        const sponsorsApprovalsSnap = await getDocs(
          query(collection(db, 'sponsors'), where('status', '==', 'pending'))
        )
        const pendingApprovals = eventsApprovalsSnap.size + sponsorsApprovalsSnap.size

        // Fetch donation approvals
        const donationApprovalsSnap = await getDocs(
          query(collection(db, 'donations'), where('status', '==', 'pending'))
        )

        // Calculate membership tiers
        let tiers = { standard: 0, gold: 0, platinum: 0 }
        members.forEach(m => {
          const tier = m.membershipTier || 'standard'
          tiers[tier] = (tiers[tier] || 0) + 1
        })

        // Fetch sponsor outreach pipeline
        const sponsorsSnap = await getDocs(collection(db, 'sponsors'))
        const outreachPipeline = sponsorsSnap.docs.filter(d => d.data().status === 'contacted').length

        // Calculate conversion rate (members who became platinum)
        const platinumMembers = members.filter(m => m.membershipTier === 'platinum').length
        const conversionRate = membersSnap.size > 0 ? Math.round((platinumMembers / membersSnap.size) * 100) : 0

        // Calculate new members this month
        const now = new Date()
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
        const newMembers = members.filter(m => {
          if (m.memberSince instanceof Date) {
            return m.memberSince >= monthAgo
          }
          return false
        }).length

        setStats({
          totalMembers: membersSnap.size,
          totalVolunteers: volunteersSnap.size,
          volunteerHours,
          totalDonations: completedDonations.length,
          totalDonationAmount,
          activeEvents: eventsSnap.size,
          eventAttendance,
          activeBusinesses: businessesSnap.size,
          charityRequests: charitySnap.size,
          beneficiaryRequests: beneficiarySnap.size,
          pendingApprovals,
          membershipTiers: tiers,
          outreachPipeline,
          donationApprovals: donationApprovalsSnap.size,
          conversionRate,
          sponsorCount: sponsorsSnap.size,
          avgDonationAmount,
          newMembersThisMonth: newMembers,
        })

        setLastUpdated(new Date())
      } catch (error) {
        console.error('[v0] Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'bg-blue-50',
      link: '/admin/members',
      trend: `${stats.newMembersThisMonth} new this month`,
    },
    {
      title: 'Total Volunteers',
      value: stats.totalVolunteers,
      icon: User2,
      color: 'bg-green-50',
      link: '/admin/volunteers',
      trend: `${stats.volunteerHours} total hours`,
    },
    {
      title: 'Volunteer Hours',
      value: stats.volunteerHours.toLocaleString(),
      icon: Clock,
      color: 'bg-purple-50',
      link: '/admin/volunteers',
      trend: 'Total contributed',
    },
    {
      title: 'Donations Received',
      value: stats.totalDonations,
      icon: Heart,
      color: 'bg-red-50',
      link: '/admin/donations',
      trend: `Avg: ${stats.avgDonationAmount.toLocaleString()} AED`,
    },
    {
      title: 'Total Donations (AED)',
      value: `${stats.totalDonationAmount.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-50',
      link: '/admin/donations',
      trend: `${stats.donationApprovals} pending approval`,
    },
    {
      title: 'Active Events',
      value: stats.activeEvents,
      icon: Calendar,
      color: 'bg-orange-50',
      link: '/admin/events',
      trend: `${stats.eventAttendance} attendees`,
    },
    {
      title: 'Event Attendance',
      value: stats.eventAttendance.toLocaleString(),
      icon: CheckCircle,
      color: 'bg-indigo-50',
      link: '/admin/events',
      trend: 'Total participation',
    },
    {
      title: 'Active Businesses',
      value: stats.activeBusinesses,
      icon: Building2,
      color: 'bg-cyan-50',
      link: '/admin/businesses',
      trend: `${stats.conversionRate}% conversion rate`,
    },
    {
      title: 'Sponsor Tracking',
      value: stats.sponsorCount,
      icon: Zap,
      color: 'bg-amber-50',
      link: '/admin/sponsors',
      trend: `${stats.outreachPipeline} in pipeline`,
    },
    {
      title: 'Charity Requests',
      value: stats.charityRequests,
      icon: Target,
      color: 'bg-pink-50',
      link: '/admin/charity',
      trend: 'Active requests',
    },
    {
      title: 'Beneficiary Support Requests',
      value: stats.beneficiaryRequests,
      icon: Heart,
      color: 'bg-rose-50',
      link: '/admin/beneficiary-requests',
      trend: 'Awaiting review',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertTriangle,
      color: 'bg-amber-100',
      link: '/admin/approvals',
      trend: 'Requires action',
    },
    {
      title: 'Conversion Analytics',
      value: `${stats.conversionRate}%`,
      icon: BarChart3,
      color: 'bg-teal-50',
      link: '/admin/analytics',
      trend: 'Tier conversion',
    },
  ]

  return (
    <>
      <AdminHeader title="Platform Overview" subtitle="Complete ecosystem visibility and management" />
      
      <div className="p-8 bg-neutral-50 dark:bg-neutral-900">
        {/* Last Updated */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Dashboard Metrics</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Real-time platform statistics and analytics
            </p>
          </div>
          {lastUpdated && (
            <div className="text-xs text-neutral-500 dark:text-neutral-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link 
                key={stat.title}
                href={stat.link}
                className={`block p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all cursor-pointer ${stat.color} dark:${stat.color.replace('50', '900')}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                      {loading ? '...' : stat.value}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                      {stat.trend}
                    </p>
                  </div>
                  <Icon className="h-6 w-6 text-neutral-400 dark:text-neutral-600 flex-shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Membership Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">Membership Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-6 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Standard</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">{stats.membershipTiers.standard}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                {stats.totalMembers > 0 ? Math.round((stats.membershipTiers.standard / stats.totalMembers) * 100) : 0}% of total
              </p>
            </Card>
            <Card className="p-6 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Gold</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">{stats.membershipTiers.gold}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                {stats.totalMembers > 0 ? Math.round((stats.membershipTiers.gold / stats.totalMembers) * 100) : 0}% of total
              </p>
            </Card>
            <Card className="p-6 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Platinum</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">{stats.membershipTiers.platinum}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                {stats.totalMembers > 0 ? Math.round((stats.membershipTiers.platinum / stats.totalMembers) * 100) : 0}% of total
              </p>
            </Card>
          </div>
        </div>

        {/* Quick Navigation */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Members', href: '/admin/members' },
              { label: 'Volunteers', href: '/admin/volunteers' },
              { label: 'Events', href: '/admin/events' },
              { label: 'Donations', href: '/admin/donations' },
              { label: 'Charities', href: '/admin/charity' },
              { label: 'Businesses', href: '/admin/businesses' },
              { label: 'Sponsors', href: '/admin/sponsors' },
              { label: 'Approvals', href: '/admin/approvals' },
              { label: 'Analytics', href: '/admin/analytics' },
              { label: 'Reporting', href: '/admin/reporting' },
              { label: 'Settings', href: '/admin/settings' },
              { label: 'Moderation', href: '/admin/moderation' },
            ].map(item => (
              <Link 
                key={item.href}
                href={item.href}
                className="px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm transition-all text-center"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
