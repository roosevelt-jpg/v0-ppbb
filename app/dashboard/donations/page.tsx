'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function DonationsPage() {
  const [donations, setDonations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchDonations = async () => {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) return

      try {
        const donationsSnap = await getDocs(
          query(
            collection(db, 'donations'),
            where('donorId', '==', firebaseUser.uid)
          )
        )

        setDonations(donationsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })))
      } catch (error) {
        console.error('[v0] Error fetching donations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDonations()
  }, [])

  const totalDonated = donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)

  return (
    <>
      <MemberHeader
        title="My Donations"
        subtitle="Track your charitable contributions"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />
      
      <div className="p-8">
        {/* Summary */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-muted-foreground">Total Donated</p>
              <p className="text-3xl font-bold mt-2">AED {totalDonated}</p>
              <p className="text-sm text-muted-foreground mt-2">{donations.length} donations</p>
            </div>
            <Link href="#donate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Make a Donation
              </Button>
            </Link>
          </div>
        </Card>

        {/* Donation History */}
        <h2 className="text-xl font-bold mb-4">Donation History</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading donations...</p>
        ) : donations.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">You haven&apos;t made any donations yet</p>
            <Button>Make Your First Donation</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {donations.map((donation: any) => (
              <Card key={donation.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{donation.campaignId}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(donation.createdAt?.toDate?.() || donation.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="capitalize">{donation.status}</span>
                    </p>
                  </div>
                  <p className="text-lg font-bold">AED {donation.amount}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
