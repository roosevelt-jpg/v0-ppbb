'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Users, Calendar, TrendingUp, AlertCircle, Heart, Clock, Building2, Target, User2, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react'

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
    pendingApprovals: 0,
    membershipTiers: { standard: 0, gold: 0, platinum: 0 },
    outreachPipeline: 0,
    donationApprovals: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch members
        const membersSnap = await getDocs(collection(db, 'users'))
        const members = membersSnap.docs.map(d => d.data())
        
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
          pendingApprovals,
          membershipTiers: tiers,
          outreachPipeline,
          donationApprovals: donationApprovalsSnap.size,
        })
      } catch (error) {
        console.error('[v0] Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'bg-blue-50',
      link: '/admin/members',
    },
    {
      title: 'Total Volunteers',
      value: stats.totalVolunteers,
      icon: User2,
      color: 'bg-green-50',
      link: '/admin/volunteers',
    },
    {
      title: 'Volunteer Hours',
      value: stats.volunteerHours.toLocaleString(),
      icon: Clock,
      color: 'bg-purple-50',
      link: '/admin/volunteers',
    },
    {
      title: 'Donations Received',
      value: stats.totalDonations,
      icon: Heart,
      color: 'bg-red-50',
      link: '/admin/donations',
    },
    {
      title: 'Donation Amount (AED)',
      value: `${stats.totalDonationAmount.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-50',
      link: '/admin/donations',
    },
    {
      title: 'Active Events',
      value: stats.activeEvents,
      icon: Calendar,
      color: 'bg-orange-50',
      link: '/admin/events',
    },
    {
      title: 'Event Attendance',
      value: stats.eventAttendance.toLocaleString(),
      icon: CheckCircle,
      color: 'bg-indigo-50',
      link: '/admin/events',
    },
    {
      title: 'Active Businesses',
      value: stats.activeBusinesses,
      icon: Building2,
      color: 'bg-cyan-50',
      link: '/admin/businesses',
    },
    {
      title: 'Charity Requests',
      value: stats.charityRequests,
      icon: Target,
      color: 'bg-pink-50',
      link: '/admin/charity',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertTriangle,
      color: 'bg-amber-50',
      link: '/admin/approvals',
    },
    {
      title: 'Donation Approvals',
      value: stats.donationApprovals,
      icon: AlertCircle,
      color: 'bg-red-100',
      link: '/admin/donations',
    },
    {
      title: 'Outreach Pipeline',
      value: stats.outreachPipeline,
      icon: TrendingUp,
      color: 'bg-teal-50',
      link: '/admin/sponsors',
    },
  ]

  return (
    <>
      <AdminHeader title="Platform Overview" subtitle="Complete ecosystem visibility and management" />
      
      <div className="p-8 bg-neutral-50">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <a 
                key={stat.title}
                href={stat.link}
                className={`block p-6 border border-neutral-200 rounded-lg hover:shadow-md transition-all cursor-pointer ${stat.color}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-neutral-900 mt-2">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                  <Icon className="h-6 w-6 text-neutral-400 flex-shrink-0" />
                </div>
              </a>
            )
          })}
        </div>

        {/* Membership Breakdown */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Membership Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-6 border border-neutral-200">
              <p className="text-sm text-neutral-600 uppercase tracking-wide">Standard</p>
              <p className="text-2xl font-bold text-neutral-900 mt-2">{stats.membershipTiers.standard}</p>
            </Card>
            <Card className="p-6 border border-neutral-200">
              <p className="text-sm text-neutral-600 uppercase tracking-wide">Gold</p>
              <p className="text-2xl font-bold text-neutral-900 mt-2">{stats.membershipTiers.gold}</p>
            </Card>
            <Card className="p-6 border border-neutral-200">
              <p className="text-sm text-neutral-600 uppercase tracking-wide">Platinum</p>
              <p className="text-2xl font-bold text-neutral-900 mt-2">{stats.membershipTiers.platinum}</p>
            </Card>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Quick Navigation</h2>
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
              <a 
                key={item.href}
                href={item.href}
                className="px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:border-neutral-300 hover:shadow-sm transition-all text-center"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
