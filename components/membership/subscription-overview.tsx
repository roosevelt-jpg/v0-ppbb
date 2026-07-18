'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore'
import { Crown } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { getMemberAssignedPlan } from '@/lib/pricing-utils'
import type { PricingPlan } from '@/lib/pricing-types'

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate()
      return Number.isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }
  const d = new Date(value as string)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatInvoiceAmount(inv: Record<string, unknown>): string {
  if (inv.amount == null) return String(inv.status || 'paid')
  const amount = Number(inv.amount)
  const currency = String(inv.currency || 'AED').toUpperCase()
  // Stripe webhooks store major units; some older rows may be cents
  const display = amount > 1000 && !inv.paidAt ? amount / 100 : amount
  return `${currency} ${display.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

type Props = {
  /** Link to full plans / checkout page */
  manageHref?: string
  className?: string
}

/**
 * Shared membership subscription summary: renewal date, months remaining,
 * invoices, and stop automatic renewal.
 */
export function MembershipSubscriptionOverview({
  manageHref = '/dashboard/membership',
  className = '',
}: Props) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null)
  const [invoices, setInvoices] = useState<Array<Record<string, unknown>>>([])
  const [cancelling, setCancelling] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    getDoc(doc(db, 'users', user.id))
      .then((snap) => {
        if (snap.exists()) setProfile(snap.data())
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'pricingPlans'), where('active', '==', true)),
      (snapshot) => {
        setPlans(
          (snapshot?.docs?.map((d) => ({ id: d.id, ...d.data() } as PricingPlan)) ?? []).sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
          )
        )
      },
      () => setPlans([])
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const unsub = onSnapshot(
      query(collection(db, 'subscriptions'), where('userId', '==', user.id)),
      async (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => {
            const status = String(s.status || '')
            return status !== 'cancelled' || s.cancelAtPeriodEnd === true
          })
          .sort((a, b) => {
            const aT = (a as { updatedAt?: { toMillis?: () => number } }).updatedAt?.toMillis?.() || 0
            const bT = (b as { updatedAt?: { toMillis?: () => number } }).updatedAt?.toMillis?.() || 0
            return bT - aT
          })
        const active = docs.find((s) => String(s.status) === 'active' || s.cancelAtPeriodEnd) || docs[0] || null
        setSubscription(active)
        if (active?.cancelAtPeriodEnd) setCancelDone(true)
        if (active?.id) {
          try {
            const { getDocs: getDocsFn } = await import('firebase/firestore')
            const charges = await getDocsFn(collection(db, 'subscriptions', String(active.id), 'charges'))
            setInvoices(
              charges.docs
                .map((c) => ({ id: c.id, ...c.data() }))
                .sort((a, b) => {
                  const aD = toDate(a.paidAt || a.createdAt)?.getTime() || 0
                  const bD = toDate(b.paidAt || b.createdAt)?.getTime() || 0
                  return bD - aD
                })
                .slice(0, 12)
            )
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
      ? String(memberRecord.membershipTier)
      : null)

  const renewFromSub = toDate(
    subscription?.nextBillingDate || subscription?.currentPeriodEnd || subscription?.renewsAt
  )
  const renewDateObj = renewFromSub || toDate(profile?.membershipRenewDate)
  const renewDate = renewDateObj ? renewDateObj.toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'
  const monthsRemaining =
    renewDateObj != null
      ? Math.max(0, Math.round((renewDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)))
      : null

  const renewalStopped =
    cancelDone ||
    Boolean(subscription?.cancelAtPeriodEnd) ||
    String(subscription?.status || '') === 'cancel_at_period_end'

  const handleCancelRenewal = async () => {
    if (!subscription?.id) {
      alert('No active subscription found to stop renewal.')
      return
    }
    if (!confirm('Stop automatic renewal? You keep access until the current period ends.')) return
    setCancelling(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          stripeSubscriptionId: subscription.stripeSubscriptionId || null,
          stopRenewalOnly: true,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Cancel failed')
      setCancelDone(true)
      alert('Renewal cancelled. You retain access until the end of the paid period.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not stop renewal')
    } finally {
      setCancelling(false)
    }
  }

  if (!user) return null

  if (!activePlanName && !subscription && invoices.length === 0) {
    return (
      <Card className={`p-5 border border-[#e4e1da] bg-white space-y-3 ${className}`}>
        <div className="flex items-start gap-3">
          <Crown className="w-6 h-6 text-neutral-900 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-neutral-900">Membership subscription</h3>
            <p className="text-sm text-neutral-600 mt-1">
              No paid membership on file yet. Choose a plan to see renewal dates, invoices, and
              renewal controls here.
            </p>
          </div>
        </div>
        <Link
          href={manageHref}
          className="inline-flex items-center justify-center min-h-[44px] px-4 bg-black text-white rounded-lg text-sm font-semibold hover:bg-neutral-800"
        >
          View membership plans
        </Link>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-5 border border-[#e4e1da] bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Crown className="w-7 h-7 text-neutral-900 shrink-0" />
            <div>
              <h3 className="font-semibold text-neutral-900">
                {activePlanName ? `${activePlanName} plan` : 'Membership'}
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                {renewalStopped ? 'Access until' : 'Renews on'}{' '}
                <span className="font-medium text-neutral-900">{renewDate}</span>
              </p>
              {monthsRemaining != null ? (
                <p className="text-sm text-neutral-500 mt-0.5">
                  ~{monthsRemaining} month{monthsRemaining === 1 ? '' : 's'} remaining
                </p>
              ) : null}
              {renewalStopped ? (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 mt-2 inline-block">
                  Automatic renewal is off
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link
              href={manageHref}
              className="inline-flex items-center justify-center min-h-[44px] px-4 border border-neutral-300 rounded-lg text-sm font-semibold hover:bg-neutral-50"
            >
              Change plan
            </Link>
            <button
              type="button"
              disabled={cancelling || !subscription || renewalStopped}
              onClick={() => void handleCancelRenewal()}
              className="min-h-[44px] px-4 border border-red-300 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? 'Stopping…' : renewalStopped ? 'Renewal stopped' : 'Stop renewal'}
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-5 border border-[#e4e1da] bg-white">
        <h3 className="font-semibold text-neutral-900 mb-3">Invoices</h3>
        {invoices.length === 0 ? (
          <p className="text-sm text-neutral-500">No invoices yet for this subscription.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 text-sm">
            {invoices.map((inv) => {
              const when = toDate(inv.paidAt || inv.createdAt)
              return (
                <li key={String(inv.id)} className="py-2.5 flex justify-between gap-3">
                  <span className="text-neutral-700 min-w-0">
                    <span className="font-medium text-neutral-900">
                      {String(inv.description || inv.stripeInvoiceId || inv.invoiceId || 'Invoice')}
                    </span>
                    {when ? ` · ${when.toLocaleDateString()}` : ''}
                    {inv.status ? (
                      <span className="ml-2 text-xs uppercase tracking-wide text-neutral-500">
                        {String(inv.status)}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-medium shrink-0">{formatInvoiceAmount(inv)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
