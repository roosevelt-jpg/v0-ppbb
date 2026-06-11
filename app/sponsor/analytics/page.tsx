'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, Target, Award, Calendar, Users, PieChart, BarChart3 } from 'lucide-react'

export default function SponsorAnalyticsPage() {
  const { user } = useAuth()
  const [stats, setStats] = React.useState({
    totalSponsored: 0,
    activeSponsorships: 0,
    completedSponsorships: 0,
    roi: 0,
    avgSponsorshipAmount: 0,
    totalImpact: 0,
    partners: 0,
  })
  const [sponsorships, setSponsorships] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user?.id) return

    const unsubscribe = onSnapshot(
      query(collection(db, 'sponsorships'), where('sponsorId', '==', user.id)),
      snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))

        setSponsorships(data)

        const totalAmount = data.reduce((sum, s) => sum + (s.amount || 0), 0)
        const active = data.filter(s => s.status === 'active').length
        const completed = data.filter(s => s.status === 'completed').length
        const uniquePartners = new Set(data.map(s => s.targetId)).size

        setStats({
          totalSponsored: totalAmount,
          activeSponsorships: active,
          completedSponsorships: completed,
          roi: completed > 0 ? Math.round((completed / (active + completed)) * 100) : 0,
          avgSponsorshipAmount: data.length > 0 ? Math.round(totalAmount / data.length) : 0,
          totalImpact: data.length, // Number of benefiting causes
          partners: uniquePartners,
        })

        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.id])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-neutral-600">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Sponsorship Analytics</h1>
          <p className="text-neutral-600 mt-1">Track your sponsorship impact and ROI</p>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Sponsored</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">
                  AED {stats.totalSponsored.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Active Sponsorships</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.activeSponsorships}</p>
                <p className="text-xs text-neutral-500 mt-1">Currently active</p>
              </div>
              <Target className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.roi}%</p>
                <p className="text-xs text-neutral-500 mt-1">{stats.completedSponsorships} completed</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Impact</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalImpact}</p>
                <p className="text-xs text-neutral-500 mt-1">Causes supported</p>
              </div>
              <Award className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Average Sponsorship</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">
                  AED {stats.avgSponsorshipAmount.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Active Partners</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">{stats.partners}</p>
                <p className="text-xs text-neutral-500 mt-1">Organizations</p>
              </div>
              <Users className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Sponsorship Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Distribution */}
          <Card className="p-6 border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Sponsorship Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-700 font-medium">Active</span>
                  <span className="text-sm font-bold text-neutral-900">{stats.activeSponsorships}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        sponsorships.length > 0
                          ? (stats.activeSponsorships / sponsorships.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-700 font-medium">Pending</span>
                  <span className="text-sm font-bold text-neutral-900">
                    {sponsorships.filter(s => s.status === 'pending').length}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full"
                    style={{
                      width: `${
                        sponsorships.length > 0
                          ? (sponsorships.filter(s => s.status === 'pending').length / sponsorships.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-700 font-medium">Completed</span>
                  <span className="text-sm font-bold text-neutral-900">{stats.completedSponsorships}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        sponsorships.length > 0
                          ? (stats.completedSponsorships / sponsorships.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Sponsorship Types */}
          <Card className="p-6 border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">By Type</h2>
            <div className="space-y-3">
              {['campaign', 'event', 'charity', 'project'].map(type => {
                const count = sponsorships.filter(s => s.type === type).length
                return (
                  count > 0 && (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700 capitalize">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  )
                )
              })}
            </div>
          </Card>

          {/* Impact Goals */}
          <Card className="p-6 border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">This Year</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600 mb-2">Sponsorship Target</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.totalSponsored > 0 ? '✓ On Track' : 'Set a goal'}
                </p>
              </div>
              <button className="w-full px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-sm font-medium text-neutral-700 transition">
                Set Annual Target
              </button>
            </div>
          </Card>
        </div>

        {/* Recent Sponsorships */}
        {sponsorships.length > 0 && (
          <Card className="p-6 border border-neutral-200 mt-8">
            <h2 className="text-lg font-bold text-neutral-900 mb-6">Recent Sponsorships</h2>
            <div className="space-y-4">
              {sponsorships.slice(0, 5).map(sponsorship => (
                <div
                  key={sponsorship.id}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900">{sponsorship.title}</h3>
                    <p className="text-sm text-neutral-600">{sponsorship.targetName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">AED {sponsorship.amount.toLocaleString()}</p>
                    <Badge className="capitalize">{sponsorship.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
