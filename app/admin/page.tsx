'use client'

import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react'

export default function AdminOverview() {
  const [stats, setStats] = React.useState({
    totalMembers: 0,
    totalEvents: 0,
    totalDonations: 0,
    systemHealth: 'healthy',
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch member count
        const membersSnap = await getDocs(collection(db, 'users'))
        
        // Fetch event count
        const eventsSnap = await getDocs(
          query(collection(db, 'events'), where('status', '!=', 'cancelled'))
        )
        
        // Fetch donation count
        const donationsSnap = await getDocs(
          query(collection(db, 'donations'), where('status', '==', 'completed'))
        )

        setStats({
          totalMembers: membersSnap.size,
          totalEvents: eventsSnap.size,
          totalDonations: donationsSnap.size,
          systemHealth: 'healthy',
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
      color: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Active Events',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Donations',
      value: `AED ${stats.totalDonations * 100}`, // Placeholder
      icon: TrendingUp,
      color: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'System Status',
      value: stats.systemHealth,
      icon: AlertCircle,
      color: 'bg-yellow-50 dark:bg-yellow-950',
    },
  ]

  return (
    <>
      <AdminHeader title="Platform Overview" subtitle="Full ecosystem visibility - Role: Founder Admin" />
      
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

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <Card className="p-6">
            <p className="text-muted-foreground text-center py-8">
              Activity dashboard coming soon. Configure your platform first in Settings.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}
