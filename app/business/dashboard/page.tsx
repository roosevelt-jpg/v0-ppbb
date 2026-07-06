'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { getBusinessDashboardStats } from '@/lib/business-queries'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Briefcase,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  AlertCircle,
  Settings,
} from 'lucide-react'

interface DashboardStats {
  opportunitiesPosted: number
  openOpportunities: number
  offersPosted: number
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

export default function BusinessDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = React.useState(true)

  // Redirect if not authenticated or not a business user
  React.useEffect(() => {
    if (!loading && (!user || !hasBusinessAccess(user))) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch dashboard stats
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

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!hasBusinessAccess(user)) {
    return <div className="flex items-center justify-center h-screen">Access Denied</div>
  }

  const StatCard = ({
    label,
    value,
    icon: Icon,
    subtext,
    onClick,
  }: {
    label: string
    value: string | number
    icon: any
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
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-7xl mx-auto">
          <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
            Business Dashboard
          </h1>
          <p style={{ color: '#888888', marginTop: '8px' }}>
            Welcome, {user.businessProfile?.businessName || user.firstName}!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Opportunities Posted"
            value={stats?.opportunitiesPosted || 0}
            icon={Briefcase}
            subtext={`${stats?.openOpportunities || 0} open`}
            onClick={() => router.push('/business/opportunities')}
          />
          <StatCard
            label="Offers Posted"
            value={stats?.offersPosted || 0}
            icon={TrendingUp}
            onClick={() => router.push('/business/offers')}
          />
          <StatCard
            label="Leads Generated"
            value={stats?.leadsGenerated || 0}
            icon={Users}
            subtext={`${Math.round(stats?.conversionRate || 0)}% conversion`}
            onClick={() => router.push('/business/leads')}
          />
          <StatCard
            label="Referral Earnings"
            value={`AED ${stats?.referralEarnings || 0}`}
            icon={DollarSign}
            subtext={`AED ${stats?.pendingCommission || 0} pending`}
            onClick={() => router.push('/business/referrals')}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              onClick={() => router.push('/business/opportunities/new')}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '8px',
              }}
              className="hover:opacity-90"
            >
              Post Opportunity
            </Button>
            <Button
              onClick={() => router.push('/business/offers/new')}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '8px',
              }}
              className="hover:opacity-90"
            >
              Post Offer
            </Button>
            <Button
              onClick={() => router.push('/business/partnerships/request')}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '8px',
              }}
              className="hover:opacity-90"
            >
              Request Partnership
            </Button>
            <Button
              onClick={() => router.push('/business/profile')}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '8px',
              }}
              className="hover:opacity-90"
            >
              Edit Profile
            </Button>
          </div>
        </Card>

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
