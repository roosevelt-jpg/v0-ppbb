'use client'

import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Crown } from 'lucide-react'

export const dynamic = 'force-dynamic'

const MEMBERSHIP_TIERS = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: 50,
    features: ['Basic event access', 'Community forum', 'Email support'],
    color: 'bg-amber-50 border-amber-200',
  },
  {
    id: 'silver',
    name: 'Silver',
    price: 100,
    features: ['All Bronze benefits', 'Priority event booking', 'Volunteer opportunities', 'Member discounts'],
    color: 'bg-slate-50 border-slate-200',
    popular: true,
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 200,
    features: ['All Silver benefits', 'Exclusive events', 'Personal mentor', 'Merchandise discount 20%'],
    color: 'bg-yellow-50 border-yellow-200',
  },
]

export default function MembershipPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) return

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          setUser(userDoc.data())
        }
      } catch (error) {
        console.error('[v0] Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleUpgrade = async (tierId: string) => {
    if (!auth.currentUser) return

    setUpgrading(true)
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        membershipTier: tierId,
        membershipStartDate: new Date(),
        membershipRenewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
      
      setUser((prev: any) => ({
        ...prev,
        membershipTier: tierId,
      }))
    } catch (error) {
      console.error('[v0] Error upgrading membership:', error)
    } finally {
      setUpgrading(false)
    }
  }

  const currentTier = user?.membershipTier || 'none'
  const renewDate = user?.membershipRenewDate ? new Date(user.membershipRenewDate).toLocaleDateString() : '-'

  return (
    <>
      <MemberHeader
        title="Membership Plans"
        subtitle="Choose your membership tier to unlock exclusive benefits"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="p-8">
        {currentTier !== 'none' && (
          <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-4">
              <Crown className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Current Plan: {MEMBERSHIP_TIERS.find(t => t.id === currentTier)?.name}</h3>
                <p className="text-sm text-muted-foreground">Renews on {renewDate}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {MEMBERSHIP_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`p-6 relative border-2 transition-all ${tier.color} ${
                currentTier === tier.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                  Popular
                </div>
              )}

              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold">AED {tier.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <div className="space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleUpgrade(tier.id)}
                disabled={upgrading || currentTier === tier.id}
                className="w-full"
                variant={currentTier === tier.id ? 'secondary' : 'default'}
              >
                {currentTier === tier.id ? 'Current Plan' : upgrading ? 'Upgrading...' : 'Choose Plan'}
              </Button>
            </Card>
          ))}
        </div>

        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">All Plans Include</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {['Access to community events', 'Member directory', 'Volunteer opportunities', 'Monthly newsletters', 'Community forum access', 'Member support'].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
