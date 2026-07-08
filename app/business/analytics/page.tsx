'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { subscribeToBusinessAnalytics, getBusinessDashboardStats } from '@/lib/business-queries'
import { BarChart3, TrendingUp, Users } from 'lucide-react'

export default function Analytics() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<any>(null)

  React.useEffect(() => {
    if (!user || (!hasBusinessAccess(user))) {
      router.push('/login')
      return
    }

    setLoading(true)
    const fetchStats = async () => {
      try {
        const dashboardStats = await getBusinessDashboardStats(user.id)
        setStats(dashboardStats)
      } catch (error) {
        console.error('[v0] Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [user, router])

  if (!user || (!hasBusinessAccess(user))) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto">
          <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
            Business Analytics
          </h1>
          <p style={{ color: '#888888', marginTop: '8px' }}>
            Your listings only — events, jobs, offers, and leads for this business account
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {loading ? (
          <div className="text-center py-8">Loading analytics...</div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <div className="flex items-center gap-4">
                  <BarChart3 style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Opportunities Posted</p>
                    <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                      {stats?.opportunitiesPosted || 0}
                    </p>
                  </div>
                </div>
              </Card>
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <div className="flex items-center gap-4">
                  <BarChart3 style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Offers Posted</p>
                    <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                      {stats?.offersPosted || 0}
                    </p>
                  </div>
                </div>
              </Card>
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <div className="flex items-center gap-4">
                  <Users style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Leads Generated</p>
                    <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                      {stats?.leadsGenerated || 0}
                    </p>
                  </div>
                </div>
              </Card>
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <div className="flex items-center gap-4">
                  <TrendingUp style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Conversion Rate</p>
                    <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                      {Math.round(stats?.conversionRate || 0)}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
              <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                Performance Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                    Open Opportunities
                  </p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '8px', fontSize: '18px' }}>
                    {stats?.openOpportunities || 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                    Converted Leads
                  </p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '8px', fontSize: '18px' }}>
                    {stats?.convertedLeads || 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                    Active Partnerships
                  </p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '8px', fontSize: '18px' }}>
                    {stats?.partnerships || 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                    Business Rating
                  </p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '8px', fontSize: '18px' }}>
                    {(stats?.averageRating || 0).toFixed(1)}/5
                  </p>
                </div>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
              <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                Financial Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                    Referral Earnings
                  </p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '8px', fontSize: '20px' }}>
                    AED {stats?.referralEarnings || 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                    Pending Commission
                  </p>
                  <p style={{ color: '#dc2626', fontWeight: 600, marginTop: '8px', fontSize: '20px' }}>
                    AED {stats?.pendingCommission || 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#888888', fontSize: '12px', textTransform: 'uppercase' }}>
                    Completed Payments
                  </p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '8px', fontSize: '20px' }}>
                    {stats?.completedPayments || 0}/{stats?.totalPayments || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
