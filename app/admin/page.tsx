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
      color: '#f7f6f2',
      borderColor: '#e4e1da',
    },
    {
      title: 'Active Events',
      value: stats.totalEvents,
      icon: Calendar,
      color: '#f7f6f2',
      borderColor: '#e4e1da',
    },
    {
      title: 'Donations (AED)',
      value: `${stats.totalDonations * 100}`,
      icon: TrendingUp,
      color: '#f7f6f2',
      borderColor: '#e4e1da',
    },
    {
      title: 'System Status',
      value: stats.systemHealth,
      icon: AlertCircle,
      color: '#f7f6f2',
      borderColor: '#e4e1da',
    },
  ]

  return (
    <>
      <AdminHeader title="Platform Overview" subtitle="Full ecosystem visibility - Role: Founder Admin" />
      
      <div className="p-8" style={{ backgroundColor: '#f7f6f2' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.title}
                className="p-6 border"
                style={{
                  backgroundColor: stat.color,
                  borderColor: stat.borderColor,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {stat.title}
                    </p>
                    <p
                      className="text-2xl font-bold mt-2"
                      style={{
                        color: '#111111',
                        fontFamily: 'Playfair Display',
                      }}
                    >
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                  <Icon className="h-6 w-6" style={{ color: '#888888' }} />
                </div>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2
            className="text-xl font-bold mb-4"
            style={{
              color: '#111111',
              fontFamily: 'Playfair Display',
            }}
          >
            Recent Activity
          </h2>
          <Card
            className="p-6 border"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e4e1da',
            }}
          >
            <p className="text-center py-8" style={{ color: '#888888', fontSize: '13px' }}>
              Activity dashboard coming soon. Configure your platform first in Settings.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}
