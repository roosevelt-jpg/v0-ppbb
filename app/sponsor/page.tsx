'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Award, Target, Users, TrendingUp, Gift, Calendar, BarChart3, Zap, ShoppingBag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface SponsorStats {
  activeCampaigns: number
  totalSponsored: number
  totalAmount: number
  partnersCount: number
  upcomingEvents: number
}

export default function SponsorDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<SponsorStats>({
    activeCampaigns: 0,
    totalSponsored: 0,
    totalAmount: 0,
    partnersCount: 0,
    upcomingEvents: 0,
  })
  const [sponsorships, setSponsorships] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (loading) return

    if (!user || user.role !== 'sponsor') {
      router.push('/login')
      return
    }

    // Load sponsor's sponsorships
    const unsubscribe = onSnapshot(
      query(collection(db, 'sponsorships'), where('sponsorId', '==', user.id)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[]

        setSponsorships(data)

        // Calculate stats
        const active = data.filter(s => s.status === 'active').length
        const total = data.length
        const amount = data.reduce((sum, s) => sum + (s.amount || 0), 0)

        setStats(prev => ({
          ...prev,
          activeCampaigns: active,
          totalSponsored: total,
          totalAmount: amount,
        }))
        setDataLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, loading, router])

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Sponsor Dashboard
              </h1>
              <p className="text-neutral-600 mt-2">
                Welcome, {user?.firstName || 'Sponsor'}. Manage your sponsorships and partnerships.
              </p>
            </div>
            <Award className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Active Campaigns</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.activeCampaigns}</p>
              </div>
              <Target className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Sponsored</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalSponsored}</p>
              </div>
              <Gift className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Amount</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">
                  {stats.totalAmount ? `AED ${stats.totalAmount.toLocaleString()}` : 'AED 0'}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Partners</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.partnersCount}</p>
              </div>
              <Users className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Upcoming Events</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.upcomingEvents}</p>
              </div>
              <Calendar className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Sponsorships List */}
        <Card className="border border-neutral-200 p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Your Sponsorships</h2>

          {sponsorships.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">No sponsorships yet</p>
              <p className="text-sm text-neutral-500 mt-2">
                Browse available campaigns and events to sponsor
              </p>
              <button
                onClick={() => router.push('/marketplace')}
                className="mt-6 px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
              >
                Browse Opportunities
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sponsorships.map((sponsorship) => (
                <div
                  key={sponsorship.id}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">{sponsorship.title || 'Untitled'}</h3>
                      <p className="text-sm text-neutral-600 mt-1">{sponsorship.description || 'No description'}</p>
                      <div className="flex gap-4 mt-3 text-sm">
                        <span className="text-neutral-600">
                          <strong>Amount:</strong> AED {sponsorship.amount?.toLocaleString() || '0'}
                        </span>
                        <span className="text-neutral-600">
                          <strong>Type:</strong> {sponsorship.type || 'General'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        sponsorship.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : sponsorship.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {sponsorship.status || 'active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Link href="/sponsor/marketplace">
            <button className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-all text-left w-full">
              <ShoppingBag className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-neutral-900">Browse Opportunities</h3>
              <p className="text-sm text-neutral-600 mt-1">Explore sponsorship options</p>
            </button>
          </Link>

          <Link href="/sponsor/profile">
            <button className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-all text-left w-full">
              <Award className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="font-semibold text-neutral-900">My Profile</h3>
              <p className="text-sm text-neutral-600 mt-1">View and edit your information</p>
            </button>
          </Link>

          <Link href="/sponsor/analytics">
            <button className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-all text-left w-full">
              <BarChart3 className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-neutral-900">Analytics</h3>
              <p className="text-sm text-neutral-600 mt-1">Track your impact and ROI</p>
            </button>
          </Link>

          <Link href="/sponsor/certificates">
            <button className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-all text-left w-full">
              <Zap className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-neutral-900">Recognition</h3>
              <p className="text-sm text-neutral-600 mt-1">View certificates and awards</p>
            </button>
          </Link>

          <Link href="/sponsor/partnerships">
            <button className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-all text-left w-full">
              <Users className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-neutral-900">Partnerships</h3>
              <p className="text-sm text-neutral-600 mt-1">Manage your relationships</p>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
