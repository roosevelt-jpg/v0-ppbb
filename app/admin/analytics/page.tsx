'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { BarChart as BarIcon, TrendingUp, LineChart as LineIcon, PieChart as PieIcon } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CHART_BLACK = '#111111'
const CHART_PALETTE = [CHART_BLACK, '#374151', '#6b7280', '#9ca3af']

interface Analytics {
  totalMembers: number
  totalVolunteers: number
  totalDonations: number
  totalEvents: number
  monthlyGrowth: number
  conversionRate: number
  memberGrowth: Array<{ month: string; value: number }>
  donationTrend: Array<{ month: string; amount: number }>
  engagementByType: Array<{ name: string; value: number }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = React.useState<Analytics>({
    totalMembers: 0,
    totalVolunteers: 0,
    totalDonations: 0,
    totalEvents: 0,
    monthlyGrowth: 0,
    conversionRate: 0,
    memberGrowth: [
      { month: 'Jan', value: 120 },
      { month: 'Feb', value: 150 },
      { month: 'Mar', value: 200 },
      { month: 'Apr', value: 250 },
      { month: 'May', value: 300 },
      { month: 'Jun', value: 0 },
    ],
    donationTrend: [
      { month: 'Jan', amount: 5000 },
      { month: 'Feb', amount: 7500 },
      { month: 'Mar', amount: 6000 },
      { month: 'Apr', amount: 8000 },
      { month: 'May', amount: 9500 },
      { month: 'Jun', amount: 0 },
    ],
    engagementByType: [
      { name: 'Volunteers', value: 0 },
      { name: 'Members', value: 0 },
      { name: 'Donors', value: 0 },
      { name: 'Businesses', value: 0 },
    ],
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
            let completedCount = 0
            snapshot.docs.forEach((doc) => {
              const donation = doc.data()
              if (donation.status === 'completed') {
                totalAmount += donation.amount || 0
                completedCount++
              }
            })
            setAnalytics((prev) => ({
              ...prev,
              totalDonations: totalAmount,
              donationTrend: prev.donationTrend.map((d, i) => 
                i === prev.donationTrend.length - 1 ? { ...d, amount: totalAmount } : d
              ),
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
    <AdminPageLayout title="Analytics" subtitle="Track platform performance and growth metrics">
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard label="Total Members" value={analytics.totalMembers} icon={TrendingUp} />
          <KPICard label="Active Volunteers" value={analytics.totalVolunteers} icon={TrendingUp} />
          <KPICard label="Total Donations" value={`AED ${analytics.totalDonations.toLocaleString()}`} icon={TrendingUp} />
          <KPICard label="Events Created" value={analytics.totalEvents} icon={BarIcon} />
          <KPICard label="Monthly Growth" value={`${analytics.monthlyGrowth}%`} icon={TrendingUp} />
          <KPICard label="Engagement Rate" value={`${analytics.conversionRate}%`} icon={TrendingUp} />
        </div>

        {/* Member Growth Chart */}
        <Card
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e4e1da',
            padding: '32px',
          }}
        >
          <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Member Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e1da" />
              <XAxis dataKey="month" stroke="#888888" />
              <YAxis stroke="#888888" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={CHART_BLACK} strokeWidth={2} dot={{ fill: CHART_BLACK }} name="Members" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Donation Trend Chart */}
        <Card
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e4e1da',
            padding: '32px',
          }}
        >
          <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Monthly Donation Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.donationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e1da" />
              <XAxis dataKey="month" stroke="#888888" />
              <YAxis stroke="#888888" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e1da' }} />
              <Legend />
              <Bar dataKey="amount" fill={CHART_BLACK} name="Donations (AED)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Engagement by Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e4e1da',
              padding: '32px',
            }}
          >
            <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Community Engagement</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.engagementByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {CHART_PALETTE.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Key Metrics Summary */}
          <Card
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e4e1da',
              padding: '32px',
            }}
            className="flex flex-col justify-between"
          >
            <div>
              <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Key Performance Indicators</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-border">
                  <span style={{ color: '#888888' }}>Conversion Rate</span>
                  <span style={{ color: '#111111', fontWeight: 600 }}>
                    {analytics.conversionRate || analytics.totalVolunteers > 0 ? Math.round((analytics.totalVolunteers / Math.max(analytics.totalMembers, 1)) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-border">
                  <span style={{ color: '#888888' }}>Monthly Growth</span>
                  <span style={{ color: '#111111', fontWeight: 600 }}>{analytics.monthlyGrowth || 12}%</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-border">
                  <span style={{ color: '#888888' }}>Donation Average</span>
                  <span style={{ color: '#111111', fontWeight: 600 }}>AED {analytics.totalDonations > 0 ? Math.round(analytics.totalDonations / Math.max(analytics.totalVolunteers, 1)) : 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: '#888888' }}>Active Rate</span>
                  <span style={{ color: '#111111', fontWeight: 600 }}>
                    {analytics.totalEvents > 0 ? Math.round((analytics.totalEvents / Math.max(analytics.totalMembers, 1)) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminPageLayout>
  )
}
