'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, CheckCircle, Clock, XCircle, Download } from 'lucide-react'
import Link from 'next/link'

export default function DonationsPage() {
  const [donations, setDonations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      setLoading(false)
      return
    }

    // Subscribe to real-time donation submissions
    const unsubscribe = onSnapshot(
      query(collection(db, 'donationSubmissions'), where('userId', '==', firebaseUser.uid)),
      (snapshot) => {
        const docsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // Sort by most recent first
        docsData.sort((a, b) => (b.submittedAt?.toDate?.() || 0) - (a.submittedAt?.toDate?.() || 0))
        setDonations(docsData)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching donations:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const totalDonated = donations
    .filter((d) => d.status === 'verified')
    .reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
  
  const pendingCount = donations.filter((d) => d.status === 'pending').length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      case 'rejected':
        return 'bg-red-50 border-red-200'
      default:
        return ''
    }
  }
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified'
      case 'pending':
        return 'Pending Verification'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }

  return (
    <>
      <MemberHeader
        title="My Donations"
        subtitle="Track your charitable contributions"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />
      
      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-gray-600 text-sm">Total Verified Donations</p>
            <p className="text-3xl font-bold mt-2">AED {totalDonated.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">{donations.filter((d) => d.status === 'verified').length} verified</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <p className="text-gray-600 text-sm">Pending Verification</p>
            <p className="text-3xl font-bold mt-2">{pendingCount}</p>
            <p className="text-sm text-gray-600 mt-2">Awaiting admin review</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-gray-600 text-sm">Total Donations</p>
            <p className="text-3xl font-bold mt-2">{donations.length}</p>
            <Link href="/donate">
              <Button className="mt-4 w-full">
                <Plus className="h-4 w-4 mr-2" />
                Make a Donation
              </Button>
            </Link>
          </Card>
        </div>

        {/* Donation History */}
        <h2 className="text-xl font-bold mb-4">Donation History</h2>
        {loading ? (
          <p className="text-gray-600">Loading donations...</p>
        ) : donations.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">You haven&apos;t made any donations yet</p>
            <Link href="/donate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Make Your First Donation
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {donations.map((donation: any) => (
              <Card key={donation.id} className={`p-4 border-2 ${getStatusColor(donation.status)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(donation.status)}
                      <p className="font-bold">{donation.causeName}</p>
                      <span className="ml-auto text-sm font-semibold">{getStatusText(donation.status)}</span>
                    </div>

                    <p className="text-sm text-gray-600">
                      Partner: <span className="font-semibold">{donation.partnerName}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Reference: <span className="font-mono text-xs">{donation.referenceNumber}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(donation.submittedAt?.toDate?.() || donation.submittedAt || new Date()).toLocaleDateString()}
                    </p>

                    {donation.rejectionReason && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Reason:</strong> {donation.rejectionReason}
                      </p>
                    )}

                    {donation.notes && (
                      <p className="text-sm text-gray-600 italic mt-2">&quot;{donation.notes}&quot;</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">AED {donation.amount}</p>
                    {donation.status === 'verified' && (
                      <button className="mt-3 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-semibold">
                        <Download className="w-4 h-4" />
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
