'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Pause, Play, Trash2, Calendar, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function RecurringDonationsPage() {
  const [subscriptions, setSubscriptions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      setLoading(false)
      return
    }

    // Subscribe to real-time recurring donations
    const unsubscribe = onSnapshot(
      query(collection(db, 'subscriptions'), where('userId', '==', firebaseUser.uid)),
      (snapshot) => {
        const docsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // Sort by most recent first
        docsData.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
        setSubscriptions(docsData)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching subscriptions:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handlePauseSubscription = async (subscriptionId: string) => {
    if (!confirm('Pause this recurring donation?')) return
    try {
      const response = await fetch('/api/subscriptions/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      })
      if (response.ok) {
        console.log('[v0] Subscription paused')
      }
    } catch (error) {
      console.error('[v0] Error pausing subscription:', error)
    }
  }

  const handleResumeSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch('/api/subscriptions/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      })
      if (response.ok) {
        console.log('[v0] Subscription resumed')
      }
    } catch (error) {
      console.error('[v0] Error resuming subscription:', error)
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Cancel this recurring donation? You can restart anytime.')) return
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      })
      if (response.ok) {
        console.log('[v0] Subscription cancelled')
      }
    } catch (error) {
      console.error('[v0] Error cancelling subscription:', error)
    }
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active')
  const pausedSubscriptions = subscriptions.filter((s) => s.status === 'paused')
  const cancelledSubscriptions = subscriptions.filter((s) => s.status === 'cancelled')

  const totalMonthlyDonation = activeSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0)

  const getNextBillingDate = (subscription: any) => {
    const date = subscription.nextBillingDate?.toDate?.() || new Date(subscription.nextBillingDate)
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-200'
      case 'paused':
        return 'bg-yellow-50 border-yellow-200'
      case 'cancelled':
        return 'bg-red-50 border-red-200'
      default:
        return ''
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'paused':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MemberHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-gray-600 text-sm">Active Subscriptions</p>
            <p className="text-3xl font-bold mt-2">{activeSubscriptions.length}</p>
            <p className="text-sm text-gray-600 mt-2">Monthly giving</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-gray-600 text-sm">Monthly Total</p>
            <p className="text-3xl font-bold mt-2">AED {totalMonthlyDonation.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">Recurring donations</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <p className="text-gray-600 text-sm">Start New Donation</p>
            <Link href="/donate?recurring=true">
              <Button className="mt-4 w-full">
                <Plus className="h-4 w-4 mr-2" />
                Set Up Monthly
              </Button>
            </Link>
          </Card>
        </div>

        {/* Active Subscriptions */}
        {activeSubscriptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Active Subscriptions</h2>
            <div className="space-y-4">
              {activeSubscriptions.map((subscription) => (
                <Card key={subscription.id} className={`p-4 border-2 ${getStatusColor(subscription.status)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(subscription.status)}
                        <p className="font-bold">{subscription.metadata?.causeName || 'Monthly Donation'}</p>
                      </div>

                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Frequency:</span> Monthly
                      </p>
                      <p className="text-sm text-gray-600">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Next Billing: {getNextBillingDate(subscription)}
                      </p>
                    </div>

                    <div className="text-right mr-4">
                      <p className="text-2xl font-bold">AED {subscription.amount}</p>
                      <p className="text-sm text-gray-600">per month</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handlePauseSubscription(subscription.id)}
                        className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800 text-sm font-semibold px-3 py-1 border border-yellow-300 rounded"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                      <button
                        onClick={() => handleCancelSubscription(subscription.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-1 border border-red-300 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Paused Subscriptions */}
        {pausedSubscriptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Paused Subscriptions</h2>
            <div className="space-y-4">
              {pausedSubscriptions.map((subscription) => (
                <Card key={subscription.id} className={`p-4 border-2 ${getStatusColor(subscription.status)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold">{subscription.metadata?.causeName || 'Monthly Donation'}</p>
                      <p className="text-sm text-gray-600">Currently paused</p>
                    </div>

                    <div className="text-right mr-4">
                      <p className="text-2xl font-bold">AED {subscription.amount}</p>
                      <p className="text-sm text-gray-600">per month</p>
                    </div>

                    <button
                      onClick={() => handleResumeSubscription(subscription.id)}
                      className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-semibold px-3 py-1 border border-green-300 rounded"
                    >
                      <Play className="w-4 h-4" />
                      Resume
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cancelled Subscriptions */}
        {cancelledSubscriptions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Cancelled Subscriptions</h2>
            <div className="space-y-4">
              {cancelledSubscriptions.map((subscription) => (
                <Card key={subscription.id} className={`p-4 border-2 ${getStatusColor(subscription.status)}`}>
                  <div className="flex justify-between items-start opacity-75">
                    <div>
                      <p className="font-bold">{subscription.metadata?.causeName || 'Monthly Donation'}</p>
                      <p className="text-sm text-gray-600">
                        Cancelled on {new Date(subscription.cancelledAt?.toDate?.() || new Date()).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-lg font-bold">AED {subscription.amount}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {subscriptions.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">You haven&apos;t set up any recurring donations yet</p>
            <Link href="/donate?recurring=true">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Start Monthly Giving
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
