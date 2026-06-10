'use client'

import React from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { User } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Heart, Users, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = React.useState<User | null>(null)
  const [stats, setStats] = React.useState({
    registeredEvents: 0,
    donationAmount: 0,
    volunteeredHours: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) return

      try {
        // Fetch user data
        const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDocSnap.exists()) {
          setUser(userDocSnap.data() as User)
        }

        // Fetch registered events
        const eventsSnap = await getDocs(
          query(
            collection(db, 'events'),
            where('attendees', 'array-contains', firebaseUser.uid)
          )
        )

        // Fetch donations
        const donationsSnap = await getDocs(
          query(
            collection(db, 'donations'),
            where('donorId', '==', firebaseUser.uid),
            where('status', '==', 'completed')
          )
        )

        const totalDonated = donationsSnap.docs.reduce(
          (sum, doc) => sum + (doc.data().amount || 0),
          0
        )

        setStats({
          registeredEvents: eventsSnap.size,
          donationAmount: totalDonated,
          volunteeredHours: userDocSnap.data()?.volunteeredHours || 0,
        })
      } catch (error) {
        console.error('[v0] Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    {
      title: 'Vol. hours',
      value: stats.volunteeredHours,
      suffix: 'hrs this year',
      icon: Clock,
      color: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Events attended',
      value: stats.registeredEvents,
      suffix: 'this year',
      icon: Calendar,
      color: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Donated',
      value: `AED ${stats.donationAmount}`,
      suffix: 'total',
      icon: Heart,
      color: 'bg-red-50 dark:bg-red-950',
    },
    {
      title: 'Membership',
      value: user?.membershipTier || 'standard',
      suffix: `since ${new Date(user?.memberSince || '').toLocaleDateString()}`,
      icon: Users,
      color: 'bg-purple-50 dark:bg-purple-950',
    },
  ]

  return (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`p-6 ${stat.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{loading ? '...' : stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.suffix}</p>
                </div>
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/events">
              <Button variant="outline" className="w-full justify-between">
                Browse Events
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/community">
              <Button variant="outline" className="w-full justify-between">
                Find Opportunities
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/donations">
              <Button variant="outline" className="w-full justify-between">
                Make a Donation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full justify-between">
                Update Profile
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Membership Status */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h3 className="font-bold mb-3">Membership Status</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {user?.membershipTier === 'standard'
              ? 'Upgrade to Gold tier for exclusive benefits'
              : 'You have premium membership benefits'}
          </p>
          <Button className="w-full">
            View Benefits
          </Button>
        </Card>
      </div>

      {/* Community Stats */}
      <Card className="p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Community Impact</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">3,412</p>
            <p className="text-sm text-muted-foreground">Active members</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">8,940</p>
            <p className="text-sm text-muted-foreground">Volunteer hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">AED 92K</p>
            <p className="text-sm text-muted-foreground">Donations tracked</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
