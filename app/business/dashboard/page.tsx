'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { getBusinessDashboardStats } from '@/lib/business-queries'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase'
import {
  BarChart3,
  Briefcase,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Settings,
  Calendar,
  UserCheck,
} from 'lucide-react'

interface DashboardStats {
  opportunitiesPosted: number
  openOpportunities: number
  pendingOpportunities?: number
  offersPosted: number
  pendingOffers?: number
  ownEvents?: number
  ownPublishedEvents?: number
  ownCommunities?: number
  leadsGenerated: number
  convertedLeads: number
  conversionRate: number
  partnerships: number
  referralEarnings: number
  pendingCommission: number
  averageRating: number
  totalPayments: number
  completedPayments: number
}

type PendingMemberRow = {
  id: string
  communityId: string
  communityName: string
  groupId: string
  groupName: string
  userId: string
  displayName?: string
  email?: string
}

export default function BusinessDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = React.useState(true)
  const [listingStatus, setListingStatus] = React.useState<{
    isApproved: boolean
    isActive: boolean
    status: string
  } | null>(null)
  const [listingReady, setListingReady] = React.useState(false)
  const [pendingMembers, setPendingMembers] = React.useState<PendingMemberRow[]>([])
  const [pendingLoading, setPendingLoading] = React.useState(false)
  const [actingMemberKey, setActingMemberKey] = React.useState<string | null>(null)

  // Redirect if not authenticated or not a business user
  React.useEffect(() => {
    if (!loading && (!user || !hasBusinessAccess(user))) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch dashboard stats (scoped to this businessId / createdBy)
  React.useEffect(() => {
    if (user?.id && hasBusinessAccess(user)) {
      const fetchStats = async () => {
        try {
          const dashboardStats = await getBusinessDashboardStats(user.id)
          setStats(dashboardStats)
        } catch (error) {
          console.error('[v0] Error fetching stats:', error)
        } finally {
          setStatsLoading(false)
        }
      }
      fetchStats()
    }
  }, [user])

  const loadPendingMembers = React.useCallback(async () => {
    if (!user?.id || !hasBusinessAccess(user)) return
    setPendingLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return
      const res = await fetch('/api/business/pending-members', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        setPendingMembers((json.data || []) as PendingMemberRow[])
      }
    } catch (error) {
      console.error('[v0] Error loading pending members:', error)
    } finally {
      setPendingLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    loadPendingMembers()
    const interval = window.setInterval(loadPendingMembers, 30000)
    return () => window.clearInterval(interval)
  }, [loadPendingMembers])

  const handlePendingDecision = async (
    row: PendingMemberRow,
    joinStatus: 'active' | 'rejected'
  ) => {
    const key = `${row.communityId}:${row.groupId}:${row.id}`
    setActingMemberKey(key)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        alert('Please sign in again.')
        return
      }
      const res = await fetch('/api/groups/members', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          communityId: row.communityId,
          groupId: row.groupId,
          memberDocId: row.id,
          joinStatus,
          approvedBy: user?.id,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Failed to update member')
        return
      }
      setPendingMembers((prev) =>
        prev.filter(
          (m) =>
            !(
              m.id === row.id &&
              m.groupId === row.groupId &&
              m.communityId === row.communityId
            )
        )
      )
    } catch (error) {
      console.error('[v0] Error updating pending member:', error)
      alert('Failed to update member')
    } finally {
      setActingMemberKey(null)
    }
  }

  React.useEffect(() => {
    if (!user?.id) return

    let cancelled = false
    let unsub: (() => void) | undefined

    void (async () => {
      try {
        const { doc, onSnapshot } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        if (cancelled) return
        unsub = onSnapshot(doc(db, 'businesses', user.id), (snap) => {
          if (cancelled) return
          if (!snap.exists()) {
            setListingStatus(null)
          } else {
            const d = snap.data()
            setListingStatus({
              isApproved: d.isApproved === true,
              isActive: d.isActive !== false,
              status: d.status || 'pending_review',
            })
          }
          setListingReady(true)
        })
      } catch {
        if (!cancelled) setListingReady(true)
      }
    })()

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [user?.id])

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!hasBusinessAccess(user)) {
    return <div className="flex items-center justify-center h-screen">Access Denied</div>
  }

  const canPostListings = listingStatus?.isApproved === true && listingStatus?.isActive === true

  const StatCard = ({
    label,
    value,
    icon: Icon,
    subtext,
    onClick,
  }: {
    label: string
    value: string | number
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    subtext?: string
    onClick?: () => void
  }) => (
    <Card
      onClick={onClick}
      className={`p-6 cursor-pointer hover:shadow-lg transition-all ${onClick ? '' : ''}`}
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e4e1da',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p style={{ color: '#888888', fontSize: '14px' }}>{label}</p>
          <p style={{ color: '#111111', fontSize: '28px', fontWeight: 600, marginTop: '8px' }}>
            {value}
          </p>
          {subtext && (
            <p style={{ color: '#888888', fontSize: '12px', marginTop: '4px' }}>{subtext}</p>
          )}
        </div>
        <Icon style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
      </div>
    </Card>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div
        style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da' }}
        className="px-4 py-6 sm:px-8 sm:py-8"
      >
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-2xl sm:text-[32px] font-bold text-neutral-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Business Dashboard
          </h1>
          <p className="text-neutral-500 mt-2 text-sm sm:text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
            Welcome, {user.businessProfile?.businessName || user.firstName}!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {listingReady && listingStatus && !listingStatus.isApproved && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <p className="eyebrow text-amber-800 mb-1">LISTING STATUS</p>
            <h2 className="font-headline text-xl font-bold text-neutral-900 mb-1">
              Pending admin approval
            </h2>
            <p className="font-body text-sm text-neutral-700">
              Your marketplace directory listing is under review. You can prepare offers and jobs
              after approval — they appear on your public profile once your business is live.
            </p>
          </div>
        )}

        {listingReady && listingStatus && listingStatus.isApproved && !listingStatus.isActive && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-5">
            <p className="eyebrow text-red-800 mb-1">LISTING STATUS</p>
            <h2 className="font-headline text-xl font-bold text-neutral-900 mb-1">Suspended</h2>
            <p className="font-body text-sm text-neutral-700">
              Your listing is hidden from the public directory. Contact Passive Blessings support
              for help.
            </p>
          </div>
        )}

        {/* Primary create actions — always available inside the portal */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => router.push('/business/events/new')}
            className="bg-black text-white hover:bg-gray-800 min-h-[44px] font-body"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Calendar className="w-4 h-4 mr-2 inline" />
            Create Event
          </Button>
          <Button
            type="button"
            onClick={() => router.push('/business/opportunities/new')}
            disabled={listingReady && !canPostListings}
            className="bg-black text-white hover:bg-gray-800 min-h-[44px] disabled:opacity-50 font-body"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Post a Job
          </Button>
          <Button
            type="button"
            onClick={() => router.push('/business/offers/new')}
            disabled={listingReady && !canPostListings}
            className="bg-white text-black border border-[#e4e1da] hover:bg-neutral-50 min-h-[44px] disabled:opacity-50 font-body"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Post an Offer
          </Button>
          {listingReady && canPostListings ? (
            <Button
              type="button"
              onClick={() => router.push(`/directory/${user.id}`)}
              className="bg-white text-black border border-[#e4e1da] hover:bg-neutral-50 min-h-[44px] font-body"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              View public profile
            </Button>
          ) : null}
        </div>

        {/* Pending Members — groups this business owns */}
        <Card
          className="p-4 sm:p-6"
          style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p
                className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Groups you created
              </p>
              <h2
                className="text-xl sm:text-2xl text-neutral-900"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Pending Members
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              <UserCheck className="w-4 h-4" />
              {pendingLoading ? 'Loading…' : `${pendingMembers.length} awaiting review`}
            </div>
          </div>
          {pendingMembers.length === 0 && !pendingLoading ? (
            <p className="text-sm text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
              No pending join requests for groups you own.
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingMembers.map((row) => {
                const key = `${row.communityId}:${row.groupId}:${row.id}`
                const busy = actingMemberKey === key
                return (
                  <li
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between border border-[#e4e1da] rounded-lg p-3 sm:p-4"
                  >
                    <div className="min-w-0">
                      <p
                        className="font-semibold text-neutral-900 truncate"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {row.displayName || row.email || row.userId || 'Member'}
                      </p>
                      <p className="text-xs sm:text-sm text-neutral-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {row.groupName} · {row.communityName}
                      </p>
                    </div>
                    <div className="flex flex-col xs:flex-row gap-2 shrink-0 w-full sm:w-auto">
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => handlePendingDecision(row, 'active')}
                        className="bg-black text-white hover:bg-gray-800 min-h-[44px] w-full sm:w-auto"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {busy ? '…' : 'Approve'}
                      </Button>
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => handlePendingDecision(row, 'rejected')}
                        className="bg-red-600 text-white hover:bg-red-700 min-h-[44px] w-full sm:w-auto"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Quick Stats Grid — own listings only */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Opportunities Posted"
            value={stats?.opportunitiesPosted || 0}
            icon={Briefcase}
            subtext={`${stats?.openOpportunities || 0} live · ${stats?.pendingOpportunities || 0} pending`}
            onClick={() => router.push('/business/opportunities')}
          />
          <StatCard
            label="Offers Posted"
            value={stats?.offersPosted || 0}
            icon={TrendingUp}
            subtext={`${stats?.pendingOffers || 0} pending approval`}
            onClick={() => router.push('/business/offers')}
          />
          <StatCard
            label="Your Events"
            value={stats?.ownEvents || 0}
            icon={Calendar}
            subtext={`${stats?.ownPublishedEvents || 0} published`}
            onClick={() => router.push('/business/events')}
          />
          <StatCard
            label="Leads Generated"
            value={stats?.leadsGenerated || 0}
            icon={Users}
            subtext={`${Math.round(stats?.conversionRate || 0)}% conversion`}
            onClick={() => router.push('/business/leads')}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Referral Earnings"
            value={`AED ${stats?.referralEarnings || 0}`}
            icon={DollarSign}
            subtext={`AED ${stats?.pendingCommission || 0} pending`}
            onClick={() => router.push('/business/referrals')}
          />
          <StatCard
            label="Active Partnerships"
            value={stats?.partnerships || 0}
            icon={Briefcase}
            onClick={() => router.push('/business/partnerships')}
          />
          <StatCard
            label="Business Rating"
            value={`${(stats?.averageRating || 0).toFixed(1)}/5`}
            icon={Star}
            subtext="Average rating"
          />
          <StatCard
            label="Completed Payments"
            value={`${stats?.completedPayments || 0}/${stats?.totalPayments || 0}`}
            icon={DollarSign}
            onClick={() => router.push('/business/payments')}
          />
        </div>

        {/* Quick Actions */}
        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <h3
            style={{
              color: '#111111',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '16px',
              fontFamily: 'Cormorant Garamond, serif',
            }}
          >
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Button
              onClick={() => router.push('/business/events/new')}
              className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Create Event
            </Button>
            <Button
              onClick={() => router.push('/business/opportunities/new')}
              className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Post Job
            </Button>
            <Button
              onClick={() => router.push('/business/offers/new')}
              className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Post Offer
            </Button>
            <Button
              onClick={() => router.push('/business/profile')}
              className="bg-white text-black border border-[#e4e1da] hover:bg-neutral-50 min-h-[44px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Community & Events Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Events Card */}
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600 }}>
                Events
              </h3>
              <Button
                onClick={() => router.push('/business/events/new')}
                style={{
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: '6px',
                }}
                className="hover:bg-black"
              >
                Create Event
              </Button>
            </div>
            <p style={{ color: '#888888', fontSize: '14px', marginBottom: '16px' }}>
              Host events and connect with community members
            </p>
            <button
              onClick={() => router.push('/business/events')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#111111',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
              }}
              className="hover:bg-black transition-colors"
            >
              View All Events
            </button>
          </Card>

          {/* Communities Card */}
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600 }}>
                Communities
              </h3>
              <Button
                onClick={() => router.push('/business/communities/create')}
                style={{
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: '6px',
                }}
                className="hover:bg-black"
              >
                Create Community
              </Button>
            </div>
            <p style={{ color: '#888888', fontSize: '14px', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
              Build communities and groups. Pending joins for groups you created appear in
              Pending Members above — you can only approve members for groups you own.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/business/communities')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  minHeight: '44px',
                  fontFamily: 'Inter, sans-serif',
                }}
                className="hover:bg-black transition-colors"
              >
                View All Communities
              </button>
            </div>
          </Card>
        </div>

        {/* Navigation Grid */}
        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Business Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Opportunities',
                description: 'Manage jobs, internships, and gigs',
                icon: Briefcase,
                href: '/business/opportunities',
              },
              {
                label: 'Offers',
                description: 'Post products, services, and discounts',
                icon: TrendingUp,
                href: '/business/offers',
              },
              {
                label: 'Leads',
                description: 'Track and manage customer leads',
                icon: Users,
                href: '/business/leads',
              },
              {
                label: 'Referrals',
                description: 'Monitor commission earnings',
                icon: DollarSign,
                href: '/business/referrals',
              },
              {
                label: 'Partnerships',
                description: 'Manage business collaborations',
                icon: Briefcase,
                href: '/business/partnerships',
              },
              {
                label: 'Analytics',
                description: 'View performance metrics',
                icon: BarChart3,
                href: '/business/analytics',
              },
              {
                label: 'Marketplace',
                description: 'Connect with community members',
                icon: Users,
                href: '/business/marketplace',
              },
              {
                label: 'Payments',
                description: 'Manage subscriptions and payouts',
                icon: DollarSign,
                href: '/business/payments',
              },
              {
                label: 'Settings',
                description: 'Configure your business profile',
                icon: Settings,
                href: '/business/profile',
              },
            ].map((item) => (
              <Card
                key={item.label}
                onClick={() => router.push(item.href)}
                className="p-6 cursor-pointer hover:shadow-lg transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e4e1da',
                }}
              >
                <item.icon style={{ color: '#111111' }} className="w-6 h-6 mb-4" />
                <h4 style={{ color: '#111111', fontWeight: 600, marginBottom: '4px' }}>
                  {item.label}
                </h4>
                <p style={{ color: '#888888', fontSize: '14px' }}>{item.description}</p>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
