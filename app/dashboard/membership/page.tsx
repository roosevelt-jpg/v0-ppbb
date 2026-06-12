'use client'

import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Crown, Loader2 } from 'lucide-react'
import { PricingPlan } from '@/lib/pricing-types'

export const dynamic = 'force-dynamic'

export default function MembershipPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

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

  // Fetch pricing plans from Firestore in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'pricingPlans'),
      where('active', '==', true),
      orderBy('order', 'asc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plansData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PricingPlan[]
        setPlans(plansData)
      },
      (error) => {
        console.error('[v0] Error fetching plans:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleCheckout = async (plan: PricingPlan) => {
    if (!auth.currentUser) {
      alert('Please log in first')
      return
    }

    setCheckingOut(plan.id)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId: auth.currentUser.uid,
          gateway: 'stripe', // Can add selector for PayPal/Ziina
        }),
      })

      const data = await response.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.sessionId) {
        // Stripe redirect
        const stripe = (window as any).Stripe
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId })
        }
      }
    } catch (error) {
      console.error('[v0] Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setCheckingOut(null)
    }
  }

  const currentTier = user?.membershipTier
  const renewDate = user?.membershipRenewDate ? new Date(user.membershipRenewDate).toLocaleDateString() : '-'

  if (loading || plans.length === 0) {
    return (
      <>
        <MemberHeader
          title="Membership Plans"
          subtitle="Loading available plans..."
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="mt-4 text-neutral-600">Loading membership plans...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <MemberHeader
        title="Membership Plans"
        subtitle="Choose your membership tier to unlock exclusive benefits"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="p-8 space-y-8">
        {currentTier && (
          <Card className="p-6 bg-blue-50 border-blue-200 border-2">
            <div className="flex items-center gap-4">
              <Crown className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold capitalize">{currentTier} Plan Active</h3>
                <p className="text-sm text-neutral-600">Renews on {renewDate}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="p-6 relative border-2 transition-all hover:shadow-lg"
              style={{
                borderColor: plan.color || '#e5e7eb',
                backgroundColor: plan.color ? `${plan.color}15` : undefined,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{plan.icon}</span>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                  </div>
                  {plan.description && <p className="text-sm text-neutral-600">{plan.description}</p>}
                </div>
              </div>

              <div className="mb-6 pb-6 border-b" style={{ borderColor: plan.color || '#e5e7eb' }}>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.currency}</span>
                  <span className="text-4xl font-bold">{(plan.price / 100).toFixed(0)}</span>
                  <span className="text-neutral-600">/{plan.billingPeriod}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {plan.features && plan.features.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-600 mb-2">Features:</p>
                    <div className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.benefits && plan.benefits.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-600 mb-2">Benefits:</p>
                    <div className="space-y-2">
                      {plan.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleCheckout(plan)}
                disabled={checkingOut === plan.id}
                className="w-full font-medium"
                variant={currentTier === plan.name ? 'secondary' : 'default'}
                style={
                  currentTier !== plan.name
                    ? {
                        backgroundColor: plan.color,
                        color: '#ffffff',
                      }
                    : undefined
                }
              >
                {checkingOut === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : currentTier === plan.name ? (
                  'Current Plan'
                ) : (
                  'Subscribe Now'
                )}
              </Button>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-neutral-50 border-neutral-200">
          <h3 className="text-lg font-semibold mb-4">All Plans Include</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Access to community events',
              'Member directory',
              'Volunteer opportunities',
              'Monthly newsletters',
              'Community forum access',
              'Member support',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2">Payment Methods Available</h3>
          <div className="space-y-2 text-sm text-neutral-700">
            <p>✓ Stripe (Credit/Debit Cards, Apple Pay, Google Pay)</p>
            <p>✓ PayPal</p>
            <p>✓ Ziina (Payment gateway for Middle East & Africa)</p>
          </div>
        </Card>
      </div>
    </>
  )
}
