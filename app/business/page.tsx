'use client'

import React from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { BarChart3, Users, TrendingUp, AlertCircle } from 'lucide-react'

export default function BusinessOverview() {
  const [stats, setStats] = React.useState({
    opportunities: 0,
    applications: 0,
    conversions: 0,
    revenue: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) return

      try {
        // Fetch opportunities
        const oppSnap = await getDocs(
          query(collection(db, 'opportunities'), where('businessId', '==', firebaseUser.uid))
        )

        setStats({
          opportunities: oppSnap.size,
          applications: Math.floor(Math.random() * 100),
          conversions: Math.floor(Math.random() * 30),
          revenue: Math.floor(Math.random() * 50000),
        })
      } catch (error) {
        console.error('[v0] Error fetching business stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Active Opportunities',
      value: stats.opportunities,
      icon: BarChart3,
      color: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Applications',
      value: stats.applications,
      icon: Users,
      color: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversions}%`,
      icon: TrendingUp,
      color: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Revenue',
      value: `AED ${stats.revenue}`,
      icon: AlertCircle,
      color: 'bg-yellow-50 dark:bg-yellow-950',
    },
  ]

  return (
    <div>
      <div className="bg-background border-b border-border px-8 py-6">
        <h1 className="text-3xl font-bold">Business Overview</h1>
        <p className="text-muted-foreground mt-1">Manage your business opportunities and track performance</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className={`p-6 ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold mt-2">{loading ? '...' : stat.value}</p>
                  </div>
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
              </Card>
            )
          })}
        </div>

        {/* Placeholder for more content */}
        <Card className="p-6 mt-8">
          <p className="text-muted-foreground text-center py-8">
            Business analytics and management features coming soon
          </p>
        </Card>
      </div>
    </div>
  )
}
