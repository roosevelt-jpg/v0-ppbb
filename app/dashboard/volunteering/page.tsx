'use client'

import React from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock, Heart, Award, TrendingUp } from 'lucide-react'

interface VolunteerRecord {
  id: string
  userId: string
  eventId?: string
  eventTitle?: string
  hours: number
  date: Timestamp
  description?: string
  verified?: boolean
  approvedBy?: string
  approvedAt?: Timestamp
}

export default function VolunteeringPage() {
  const [volunteerData, setVolunteerData] = React.useState({
    totalHours: 0,
    thisMonthHours: 0,
    thisYearHours: 0,
    records: [] as VolunteerRecord[],
  })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    console.log('[v0] Setting up volunteering listener for user:', firebaseUser.uid)

    // Get user's total volunteered hours from profile
    const userDocPromise = getDoc(doc(db, 'users', firebaseUser.uid))

    // Get volunteer records for this user
    const q = query(
      collection(db, 'volunteerRecords'),
      where('userId', '==', firebaseUser.uid)
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as VolunteerRecord))

        // Sort by date (newest first)
        records.sort((a, b) => {
          const aDate = a.date?.toDate?.() || new Date(0)
          const bDate = b.date?.toDate?.() || new Date(0)
          return bDate.getTime() - aDate.getTime()
        })

        // Calculate hours
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const thisMonthHours = records
          .filter((r) => {
            const rDate = r.date?.toDate?.() || new Date(0)
            return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear
          })
          .reduce((sum, r) => sum + (r.hours || 0), 0)

        const thisYearHours = records
          .filter((r) => {
            const rDate = r.date?.toDate?.() || new Date(0)
            return rDate.getFullYear() === currentYear
          })
          .reduce((sum, r) => sum + (r.hours || 0), 0)

        const totalHours = records.reduce((sum, r) => sum + (r.hours || 0), 0)

        // Also get total from user profile (may be more accurate)
        const userSnap = await userDocPromise
        const profileHours = userSnap.data()?.volunteeredHours || 0

        console.log('[v0] Volunteer records loaded:', records.length, 'Total hours:', totalHours)

        setVolunteerData({
          totalHours: Math.max(totalHours, profileHours),
          thisMonthHours,
          thisYearHours,
          records,
        })
        setError(null)
      } catch (err) {
        console.error('[v0] Error processing volunteer data:', err)
        setError('Failed to process volunteer data')
      } finally {
        setLoading(false)
      }
    }, (err) => {
      console.error('[v0] Firestore error fetching volunteer records:', err)
      setError(err.message || 'Failed to load volunteer records')
      setLoading(false)
    })

    return () => {
      console.log('[v0] Cleaning up volunteering listener')
      unsubscribe()
    }
  }, [])

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Date TBA'
    try {
      const date = timestamp.toDate?.() || new Date(timestamp as any)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Volunteering Hours</h1>
        <Card className="p-8 text-center text-gray-500">
          <div className="animate-pulse">Loading your volunteering records...</div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Volunteering Hours</h1>
        <Card className="p-8 border-red-200 bg-red-50">
          <p className="text-red-700 font-semibold">Error loading records</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Volunteering Hours</h1>
        <p className="text-gray-600">Track your volunteer contributions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Hours</p>
              <p className="text-3xl font-bold text-gray-900">{volunteerData.totalHours}</p>
              <p className="text-xs text-gray-500 mt-2">All-time</p>
            </div>
            <Clock className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Year</p>
              <p className="text-3xl font-bold text-gray-900">{volunteerData.thisYearHours}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date().getFullYear()}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-3xl font-bold text-gray-900">{volunteerData.thisMonthHours}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date().toLocaleDateString('en-US', { month: 'long' })}</p>
            </div>
            <Heart className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Volunteer Records */}
      {volunteerData.records.length === 0 ? (
        <Card className="p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No volunteer records yet</h2>
          <p className="text-gray-500 mb-6">Your volunteering hours will appear here once admins log them</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xl font-bold mb-4">Volunteer Records</h2>
          {volunteerData.records.map((record) => (
            <Card key={record.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {record.eventTitle ? (
                    <h3 className="font-semibold text-gray-900">{record.eventTitle}</h3>
                  ) : (
                    <h3 className="font-semibold text-gray-900">Volunteer Activity</h3>
                  )}
                  {record.description && (
                    <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">{formatDate(record.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{record.hours}</p>
                  <p className="text-xs text-gray-500">hours</p>
                  {record.verified ? (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-semibold">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-semibold">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
