'use client'

import React from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Users, Calendar, TrendingUp, Heart, Clock, Building2, Target, User2, DollarSign, CheckCircle, AlertTriangle, Zap, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { BUTTON_PRIMARY, GRID_2COL, GRID_3COL, FLEX_BETWEEN, TEXT_SECTION, TEXT_SMALL } from '@/lib/admin-design-system'

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
    <AdminPageLayout title="Dashboard" subtitle="Platform overview and real-time metrics">
      <div className="space-y-8">
        {/* Header Section */}
        <div className={FLEX_BETWEEN}>
          <div>
            <h2 className={TEXT_SECTION}>Platform Metrics</h2>
            <p className={TEXT_SMALL + ' mt-1'}>Real-time statistics and key performance indicators</p>
          </div>
          {lastUpdated && (
            <div className="text-xs text-neutral-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link 
                key={stat.title}
                href={stat.link}
              >
                <div className="h-full bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide truncate">
                        {stat.title}
                      </p>
                      <p className="text-2xl md:text-3xl font-bold text-neutral-900 mt-2">
                        {loading ? '...' : stat.value}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {stat.trend}
                      </p>
                    </div>
                    <Icon className="h-5 w-5 text-neutral-300 flex-shrink-0 ml-2" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Membership Breakdown */}
        <div>
          <h3 className={TEXT_SECTION + ' mb-4'}>Membership Tiers</h3>
          <div className={GRID_3COL}>
            {[
              { tier: 'Standard', count: stats.membershipTiers.standard },
              { tier: 'Gold', count: stats.membershipTiers.gold },
              { tier: 'Platinum', count: stats.membershipTiers.platinum },
            ].map((item) => (
              <div key={item.tier} className="bg-white border border-neutral-200 rounded-lg p-4">
                <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">{item.tier}</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{item.count}</p>
                <p className="text-xs text-neutral-500 mt-2">
                  {stats.totalMembers > 0 ? Math.round((item.count / stats.totalMembers) * 100) : 0}% of total
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Navigation */}
        <div>
          <h3 className={TEXT_SECTION + ' mb-4'}>Quick Navigation</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
              >
                <button className={BUTTON_PRIMARY + ' w-full text-sm'}>
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}
