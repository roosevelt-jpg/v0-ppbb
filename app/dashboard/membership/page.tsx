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
  const [gateways, setGateways] = useState<{ stripe: boolean; paypal: boolean; ziina: boolean }>({
    stripe: true,
    paypal: false,
    ziina: false,
  })
  const [statusBanner, setStatusBanner] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null)
  const [invoices, setInvoices] = useState<Array<Record<string, unknown>>>([])
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const status = new URLSearchParams(window.location.search).get('status')
    if (status === 'success') setStatusBanner('Payment successful. Your membership is updating.')
    else if (status === 'canceled') setStatusBanner('Checkout was canceled.')
    else if (status === 'error') setStatusBanner('Payment could not be completed. Please try again or contact support.')
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

  useEffect(() => {
    if (!user?.id) return
    const unsub = onSnapshot(
      query(collection(db, 'subscriptions'), where('userId', '==', user.id)),
      async (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.status !== 'cancelled')
          .sort((a, b) => {
            const aT = (a as { updatedAt?: { toMillis?: () => number } }).updatedAt?.toMillis?.() || 0
            const bT = (b as { updatedAt?: { toMillis?: () => number } }).updatedAt?.toMillis?.() || 0
            return bT - aT
          })
        const active = docs[0] || null
        setSubscription(active)
        if (active?.id) {
          try {
            const { getDocs: getDocsFn } = await import('firebase/firestore')
            const charges = await getDocsFn(collection(db, 'subscriptions', String(active.id), 'charges'))
            setInvoices(charges.docs.map((c) => ({ id: c.id, ...c.data() })).slice(0, 12))
          } catch {
            setInvoices([])
          }
        } else {
          setInvoices([])
        }
      },
      () => {
        setSubscription(null)
        setInvoices([])
      }
    )
    return () => unsub()
  }, [user?.id])

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

  const handleCancelRenewal = async () => {
    if (!subscription?.id) {
      alert('No active subscription found to cancel.')
      return
    }
    if (!confirm('Stop automatic renewal? You keep access until the current period ends.')) return
    setCancelling(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId || subscription.id,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Cancel failed')
      alert('Renewal cancelled. You retain access until the end of the paid period.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not cancel renewal')
    } finally {
      setCancelling(false)
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
  const renewRaw = profile?.membershipRenewDate
  const renewDateObj =
    renewRaw instanceof Date
      ? renewRaw
      : renewRaw && typeof renewRaw === 'object' && 'toDate' in (renewRaw as object)
        ? (renewRaw as { toDate: () => Date }).toDate()
        : renewRaw
          ? new Date(renewRaw as string)
          : null
  const renewDate =
    renewDateObj && !Number.isNaN(renewDateObj.getTime())
      ? renewDateObj.toLocaleDateString()
      : '—'
  const monthsRemaining =
    renewDateObj && !Number.isNaN(renewDateObj.getTime())
      ? Math.max(
          0,
          Math.round(
            (renewDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)
          )
        )
      : null


  return (
    <DashboardPageShell title="Membership" subtitle="Your plan, renewal, and invoices">
      {statusBanner ? (
        <Card className="p-4 mb-6 border border-neutral-200 bg-neutral-50 text-sm text-neutral-700">
          {statusBanner}
        </Card>
      ) : null}
      {activePlanName ? (
        <Card className="p-5 mb-6 border border-neutral-200 bg-neutral-50 space-y-3">
          <div className="flex items-center gap-4">
            <Crown className="w-8 h-8 text-neutral-900" />
            <div>
              <h3 className="font-semibold">{activePlanName} Plan Active</h3>
              <p className="text-sm text-neutral-600">Renews on {renewDate}</p>
              {monthsRemaining != null ? (
                <p className="text-xs text-neutral-500 mt-0.5">
                  ~{monthsRemaining} month{monthsRemaining === 1 ? '' : 's'} remaining
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            disabled={cancelling || !subscription}
            onClick={() => void handleCancelRenewal()}
            className="text-sm border border-red-300 text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Stop automatic renewal'}
          </button>
        </Card>
      ) : null}

      {invoices.length > 0 ? (
        <Card className="p-5 mb-8 border border-neutral-200">
          <h3 className="font-semibold mb-3">Invoices / charges</h3>
          <ul className="divide-y divide-neutral-200 text-sm">
            {invoices.map((inv) => (
              <li key={String(inv.id)} className="py-2 flex justify-between gap-3">
                <span>
                  {String(inv.description || inv.invoiceId || inv.id)}
                  {inv.createdAt
                    ? ` · ${new Date(
                        typeof (inv.createdAt as { toDate?: () => Date }).toDate === 'function'
                          ? (inv.createdAt as { toDate: () => Date }).toDate()
                          : (inv.createdAt as string)
                      ).toLocaleDateString()}`
                    : ''}
                </span>
                <span className="font-medium shrink-0">
                  {inv.amount != null
                    ? `${inv.currency || 'AED'} ${Number(inv.amount) / (Number(inv.amount) > 1000 ? 100 : 1)}`
                    : inv.status || 'paid'}
                </span>
              </li>
            ))}
          </ul>
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
