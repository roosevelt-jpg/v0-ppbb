'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { BarChart, TrendingUp } from 'lucide-react'

interface Analytics {
  totalMembers: number
  totalVolunteers: number
  totalDonations: number
  totalEvents: number
  monthlyGrowth: number
  conversionRate: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = React.useState<Analytics>({
    totalMembers: 0,
    totalVolunteers: 0,
    totalDonations: 0,
    totalEvents: 0,
    monthlyGrowth: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Fetch analytics from Firestore
    const fetchAnalytics = async () => {
      try {
        // Subscribe to users collection to count members
        const usersUnsubscribe = onSnapshot(
          query(collection(db, 'users')),
          (snapshot) => {
            let memberCount = 0
            let volunteerCount = 0
            snapshot.docs.forEach((doc) => {
              const user = doc.data()
              if (user.role?.includes('member')) memberCount++
              if (user.role?.includes('volunteer')) volunteerCount++
            })
            setAnalytics((prev) => ({
              ...prev,
              totalMembers: memberCount,
              totalVolunteers: volunteerCount,
            }))
          }
        )

        // Subscribe to donations
        const donationsUnsubscribe = onSnapshot(
          query(collection(db, 'donations')),
          (snapshot) => {
            let totalAmount = 0
            snapshot.docs.forEach((doc) => {
              totalAmount += doc.data().amount || 0
            })
            setAnalytics((prev) => ({
              ...prev,
              totalDonations: totalAmount,
            }))
          }
        )

        // Subscribe to events
        const eventsUnsubscribe = onSnapshot(
          query(collection(db, 'events')),
          (snapshot) => {
            setAnalytics((prev) => ({
              ...prev,
              totalEvents: snapshot.docs.length,
            }))
          }
        )

        setLoading(false)

        return () => {
          usersUnsubscribe()
          donationsUnsubscribe()
          eventsUnsubscribe()
        }
      } catch (error) {
        console.error('[v0] Error fetching analytics:', error)
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const KPICard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) => (
    <Card
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e4e1da',
        padding: '24px',
      }}
      className="flex items-start justify-between"
    >
      <div>
        <p style={{ color: '#888888', fontSize: '12px' }} className="mb-2">
          {label}
        </p>
        <p style={{ color: '#111111', fontSize: '28px', fontWeight: 700 }}>{value}</p>
      </div>
      <Icon style={{ color: '#888888', opacity: 0.3 }} className="h-8 w-8" />
    </Card>
  )

  return (
    <div className="space-y-6">
      <AdminHeader title="Analytics" subtitle="Platform performance and key metrics" />
      <div className="px-8 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard label="Total Members" value={analytics.totalMembers} icon={TrendingUp} />
          <KPICard label="Active Volunteers" value={analytics.totalVolunteers} icon={TrendingUp} />
          <KPICard label="Total Donations" value={`AED ${analytics.totalDonations.toLocaleString()}`} icon={TrendingUp} />
          <KPICard label="Events Created" value={analytics.totalEvents} icon={BarChart} />
          <KPICard label="Monthly Growth" value={`${analytics.monthlyGrowth}%`} icon={TrendingUp} />
          <KPICard label="Engagement Rate" value={`${analytics.conversionRate}%`} icon={TrendingUp} />
        </div>

        {/* Chart Placeholder */}
        <Card
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e4e1da',
            padding: '32px',
            minHeight: '300px',
          }}
          className="flex items-center justify-center"
        >
          <div className="text-center">
            <BarChart style={{ color: '#888888', opacity: 0.3 }} className="h-12 w-12 mx-auto mb-4" />
            <p style={{ color: '#888888' }}>Advanced analytics charts coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
