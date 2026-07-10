'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Check, Crown, Loader2 } from 'lucide-react'
import { PricingPlan } from '@/lib/pricing-types'
import { getMemberAssignedPlan, getPlanIncludedItems, memberMatchesPlan } from '@/lib/pricing-utils'
import { getReferralCodeFromDocument } from '@/lib/referral-cookie'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
} from '@/components/dashboard-states'

export default function MembershipPage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

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

  const handleCheckout = async (plan: PricingPlan) => {
    if (!user?.id) return
    setCheckingOut(plan.id)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
          gateway: 'stripe',
          referralCode: getReferralCodeFromDocument(),
        }),
      })
      const data = await response.json()
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    } catch (err) {
      console.error('[v0] Checkout error:', err)
      alert('Failed to start checkout. Please try again.')
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
  const assignedPlan = getMemberAssignedPlan(memberRecord, plans)
  const activePlanName =
    assignedPlan?.name ||
    (typeof profile?.membershipPlanName === 'string' ? profile.membershipPlanName : null) ||
    (typeof memberRecord.membershipTier === 'string' && memberRecord.membershipTier !== 'standard'
      ? memberRecord.membershipTier
      : null)
  const renewDate = profile?.membershipRenewDate
    ? new Date(profile.membershipRenewDate as string).toLocaleDateString()
    : '—'

  return (
    <DashboardPageShell title="Membership" subtitle="Your plan and available upgrades">
      {activePlanName ? (
        <Card className="p-5 mb-8 border border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-4">
            <Crown className="w-8 h-8 text-neutral-900" />
            <div>
              <h3 className="font-semibold">{activePlanName} Plan Active</h3>
              <p className="text-sm text-neutral-600">Renews on {renewDate}</p>
            </div>
          </div>
        </Card>
      ) : null}

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
            {plan.description ? <p className="text-sm text-neutral-600 mb-4">{plan.description}</p> : null}
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
                'Subscribe Now'
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
