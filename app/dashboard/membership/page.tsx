'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { auth, db } from '@/lib/firebase'
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
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoMessage, setPromoMessage] = useState<string | null>(null)

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

    // Live listener (not a one-time getDoc): the redirect back from Stripe
    // arrives before the webhook has necessarily finished crediting the
    // membership, and PayPal/Ziina returns happen inline on this same
    // request cycle — either way, a one-time fetch here could render the
    // stale "pending_payment" state and never update without a manual
    // reload. This picks up the change as soon as it lands.
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.id),
      (snap) => {
        if (snap.exists()) setProfile(snap.data())
      },
      (err) => console.error('[v0] profile error:', err)
    )

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

    return () => {
      unsubProfile()
      unsub()
    }
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

  const refreshProfile = async () => {
    if (!user?.id) return
    const snap = await getDoc(doc(db, 'users', user.id))
    if (snap.exists()) setProfile(snap.data())
  }

  const handleRedeemPromo = async () => {
    const code = promoCode.trim()
    if (!code || !user?.id) return
    setPromoLoading(true)
    setPromoMessage(null)
    try {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) throw new Error('Sign in required')
      const token = await firebaseUser.getIdToken()
      const res = await fetch('/api/membership/redeem-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not redeem promo code')
      }
      setPromoMessage(
        data.data?.renewDate
          ? `Activated ${data.data?.planName || 'membership'} until ${new Date(
              data.data.renewDate
            ).toLocaleDateString()}.`
          : `Activated ${data.data?.planName || 'membership'} — free forever.`
      )
      setPromoCode('')
      setStatusBanner('Promo applied. Your membership is active.')
      await refreshProfile()
    } catch (err) {
      setPromoMessage(err instanceof Error ? err.message : 'Redeem failed')
    } finally {
      setPromoLoading(false)
    }
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
  const alreadyUsedPromo = Boolean(profile?.membershipPromoCodeId || profile?.promoCodeId)

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

      <Card className="p-4 sm:p-6 mb-8 border border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-900 mb-1">Have a promo code?</h3>
        <p className="text-xs text-neutral-600 mb-3">
          Redeem a free-access membership code. Each account can redeem one promo.
        </p>
        {alreadyUsedPromo ? (
          <p className="text-sm text-neutral-700">
            Promo already applied
            {profile?.membershipPromoCode ? (
              <>
                {' '}
                (<code className="font-mono text-xs">{String(profile.membershipPromoCode)}</code>)
              </>
            ) : null}
            .
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="FOUNDERS500"
              className="flex-1 min-w-0 px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => void handleRedeemPromo()}
              disabled={promoLoading || !promoCode.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold !bg-black !text-white disabled:opacity-50 min-h-[40px]"
            >
              {promoLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Applying…
                </span>
              ) : (
                'Apply code'
              )}
            </button>
          </div>
        )}
        {promoMessage ? (
          <p className="text-xs mt-2 text-neutral-700">{promoMessage}</p>
        ) : null}
      </Card>

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
