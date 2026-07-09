'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getBusinessDashboardStats } from '@/lib/business-queries'
import { BarChart3, TrendingUp, Users } from 'lucide-react'

export default function Analytics() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState<Awaited<
    ReturnType<typeof getBusinessDashboardStats>
  > | null>(null)

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError(null)
    void getBusinessDashboardStats(user.id)
      .then((dashboardStats) => {
        setStats(dashboardStats)
      })
      .catch((err) => {
        console.error('[v0] Error fetching analytics:', err)
        setError('Unable to load analytics. Deploy Firestore rules/indexes if this persists.')
      })
      .finally(() => setLoading(false))
  }, [user, router])

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {loading ? (
          <div className="text-center py-8 text-neutral-500">Loading analytics...</div>
        ) : error ? (
          <Card className="p-8 text-center border-[#e4e1da] bg-white text-neutral-900">
            <p className="text-neutral-500 mb-4">{error}</p>
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] bg-neutral-900 text-white hover:bg-neutral-800"
            >
              Retry
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 sm:p-6 border-[#e4e1da] bg-white text-neutral-900">
                <div className="flex items-center gap-4">
                  <BarChart3 className="w-8 h-8 text-neutral-900 opacity-30" />
                  <div>
                    <p className="text-neutral-500 text-sm">Opportunities Posted</p>
                    <p className="text-neutral-900 text-2xl font-semibold">
                      {stats?.opportunitiesPosted || 0}
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">
                      {stats?.pendingOpportunities || 0} pending approval
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 sm:p-6 border-[#e4e1da] bg-white text-neutral-900">
                <div className="flex items-center gap-4">
                  <BarChart3 className="w-8 h-8 text-neutral-900 opacity-30" />
                  <div>
                    <p className="text-neutral-500 text-sm">Offers Posted</p>
                    <p className="text-neutral-900 text-2xl font-semibold">
                      {stats?.offersPosted || 0}
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">
                      {stats?.pendingOffers || 0} pending approval
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 sm:p-6 border-[#e4e1da] bg-white text-neutral-900">
                <div className="flex items-center gap-4">
                  <Users className="w-8 h-8 text-neutral-900 opacity-30" />
                  <div>
                    <p className="text-neutral-500 text-sm">Your Events</p>
                    <p className="text-neutral-900 text-2xl font-semibold">
                      {stats?.ownEvents || 0}
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">
                      {stats?.ownPublishedEvents || 0} published
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 sm:p-6 border-[#e4e1da] bg-white text-neutral-900">
                <div className="flex items-center gap-4">
                  <TrendingUp className="w-8 h-8 text-neutral-900 opacity-30" />
                  <div>
                    <p className="text-neutral-500 text-sm">Leads (yours)</p>
                    <p className="text-neutral-900 text-2xl font-semibold">
                      {stats?.leadsGenerated || 0}
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">
                      {Math.round(stats?.conversionRate || 0)}% conversion
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 sm:p-6 border-[#e4e1da] bg-white text-neutral-900">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Performance Overview</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-neutral-500 text-xs uppercase">Open Opportunities</p>
                  <p className="text-neutral-900 font-semibold mt-2 text-lg">
                    {stats?.openOpportunities || 0}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 text-xs uppercase">Converted Leads</p>
                  <p className="text-neutral-900 font-semibold mt-2 text-lg">
                    {stats?.convertedLeads || 0}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 text-xs uppercase">Active Partnerships</p>
                  <p className="text-neutral-900 font-semibold mt-2 text-lg">
                    {stats?.partnerships || 0}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 text-xs uppercase">Business Rating</p>
                  <p className="text-neutral-900 font-semibold mt-2 text-lg">
                    {(stats?.averageRating || 0).toFixed(1)}/5
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 border-[#e4e1da] bg-white text-neutral-900">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-neutral-500 text-xs uppercase">Referral Earnings</p>
                  <p className="text-neutral-900 font-semibold mt-2 text-xl">
                    AED {stats?.referralEarnings || 0}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 text-xs uppercase">Pending Commission</p>
                  <p className="text-red-600 font-semibold mt-2 text-xl">
                    AED {stats?.pendingCommission || 0}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 text-xs uppercase">Completed Payments</p>
                  <p className="text-neutral-900 font-semibold mt-2 text-xl">
                    {stats?.completedPayments || 0}/{stats?.totalPayments || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
    </div>
  )
}
