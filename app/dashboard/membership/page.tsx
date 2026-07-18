'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import { PricingPlan } from '@/lib/pricing-types'
import { getPlanIncludedItems, memberMatchesPlan } from '@/lib/pricing-utils'
import { getReferralCodeFromDocument } from '@/lib/referral-cookie'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
} from '@/components/dashboard-states'
import { MembershipSubscriptionOverview } from '@/components/membership/subscription-overview'
import { usePathname } from 'next/navigation'

export default function MembershipPage() {
  const { user, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const manageHref = pathname?.startsWith('/business') ? '/business/membership' : '/dashboard/membership'
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [gateways, setGateways] = useState<{ stripe: boolean; paypal: boolean; ziina: boolean }>({
    stripe: true,
    paypal: false,
    ziina: false,
  })
  const [statusBanner, setStatusBanner] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const status = new URLSearchParams(window.location.search).get('status')
    if (status === 'success') setStatusBanner('Payment successful. Your membership is updating.')
    else if (status === 'canceled') setStatusBanner('Checkout was canceled.')
    else if (status === 'error')
      setStatusBanner('Payment could not be completed. Please try again or contact support.')
  }, [])

  useEffect(() => {
    fetch('/api/checkout/gateways')
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setGateways(json.data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }

    getDoc(doc(db, 'users', user.id))
      .then((snap) => {
        if (snap.exists()) setProfile(snap.data())
      })
      .catch((err) => console.error('[v0] profile error:', err))

    const unsub = onSnapshot(
      query(collection(db, 'pricingPlans'), where('active', '==', true)),
      (snapshot) => {
        const activePlans = (snapshot?.docs?.map((d) => ({ id: d.id, ...d.data() } as PricingPlan)) ?? [])
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setPlans(activePlans)
        setLoading(false)
      },
      (err) => {
        console.error('[v0] plans error:', err)
        setError('Failed to load membership plans.')
        setLoading(false)
      }
    )

    return () => unsub()
  }, [authLoading, user?.id])

  const resolveGateway = (plan: PricingPlan): 'stripe' | 'paypal' | 'ziina' => {
    const preferred = plan.paymentGateway || 'stripe'
    if (preferred === 'paypal' && gateways.paypal) return 'paypal'
    if (preferred === 'ziina' && gateways.ziina) return 'ziina'
    if (preferred === 'stripe' && gateways.stripe) return 'stripe'
    if (gateways.stripe) return 'stripe'
    if (gateways.paypal) return 'paypal'
    if (gateways.ziina) return 'ziina'
    return preferred
  }

  const handleCheckout = async (plan: PricingPlan) => {
    if (!user?.id) return
    setCheckingOut(plan.id)
    try {
      const gateway = resolveGateway(plan)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
          gateway,
          referralCode: getReferralCodeFromDocument(),
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || `Checkout failed (${gateway})`)
      }
      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error('[v0] Checkout error:', err)
      alert(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.')
    } finally {
      setCheckingOut(null)
    }
  }

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  const memberRecord = {
    ...(profile ?? {}),
    id: user?.id,
    membershipTier: profile?.membershipTier ?? user?.membershipTier,
    membershipPlanId: profile?.membershipPlanId,
    membershipPlanName: profile?.membershipPlanName,
  }

  return (
    <DashboardPageShell title="Membership" subtitle="Your plan, renewal, and invoices">
      {statusBanner ? (
        <Card className="p-4 mb-6 border border-neutral-200 bg-neutral-50 text-sm text-neutral-700">
          {statusBanner}
        </Card>
      ) : null}

      <div className="mb-8">
        <MembershipSubscriptionOverview manageHref={manageHref} />
      </div>

      {plans.length === 0 ? (
        <Card className="p-6 border border-neutral-200 text-sm text-neutral-600">
          No membership plans are available yet. Check back soon or contact support.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const isCurrentPlan = memberMatchesPlan(memberRecord, plan)
            return (
              <Card key={plan.id} className="p-6 border-2 border-neutral-200 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{plan.icon}</span>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>
                {plan.description ? (
                  <p className="text-sm text-neutral-600 mb-4">{plan.description}</p>
                ) : null}
                <div className="mb-4 pb-4 border-b border-neutral-200">
                  <span className="text-3xl font-bold">
                    {plan.currency} {(plan.price / 100).toFixed(0)}
                  </span>
                  <span className="text-neutral-600">/{plan.billingPeriod}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {getPlanIncludedItems(plan).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleCheckout(plan)}
                  disabled={checkingOut === plan.id || isCurrentPlan}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold ${
                    isCurrentPlan
                      ? '!bg-white !text-black border border-gray-300'
                      : '!bg-black !text-white'
                  } disabled:opacity-50`}
                >
                  {checkingOut === plan.id ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </span>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    `Subscribe with ${resolveGateway(plan).replace(/^./, (c) => c.toUpperCase())}`
                  )}
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}
