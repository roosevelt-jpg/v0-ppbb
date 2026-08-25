'use client'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { PricingPlan } from '@/lib/pricing-types'
import { formatPlanPrice } from '@/lib/pricing-utils'
import { adminApiFetch } from '@/lib/admin-api-client'
import { BUTTON_PRIMARY, INPUT_STYLE } from '@/lib/admin-design-system'
import { Plus, Pause, Play } from 'lucide-react'
import { format } from 'date-fns'

type PromoRow = {
  id: string
  code: string
  label: string
  description: string
  type: 'free_access' | 'percent_off'
  percentOff: number
  planId: string
  planName: string
  benefitDurationMonths: number
  trialEnabled: boolean
  maxRedemptions: number | null
  usedCount: number
  codeExpiresAt: string | null
  status: string
  createdAt: string | null
}

const EMPTY_FORM = {
  code: '',
  label: '',
  description: '',
  planId: '',
  benefitDurationMonths: 3 as number | 'forever',
  trialEnabled: false,
  maxRedemptions: '500',
  codeExpiresAt: '',
}

export default function AdminPromoCodesPage() {
  const [plans, setPlans] = React.useState<PricingPlan[]>([])
  const [codes, setCodes] = React.useState<PromoRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({ ...EMPTY_FORM })
  const [error, setError] = React.useState<string | null>(null)

  const loadCodes = React.useCallback(async () => {
    setError(null)
    const json = await adminApiFetch<PromoRow[]>('/api/admin/promo-codes')
    if (json.success && Array.isArray(json.data)) {
      setCodes(json.data)
      setLoading(false)
      return
    }

    // Client fallback if the admin API is unavailable
    try {
      const { getDocs } = await import('firebase/firestore')
      const snap = await getDocs(collection(db, 'membershipPromoCodes'))
      const rows: PromoRow[] = snap.docs
        .map((d) => {
          const row = d.data()
          const codeExpiresAt =
            row.codeExpiresAt?.toDate?.()?.toISOString?.() ||
            (typeof row.codeExpiresAt === 'string' ? row.codeExpiresAt : null)
          const createdAt =
            row.createdAt?.toDate?.()?.toISOString?.() ||
            (typeof row.createdAt === 'string' ? row.createdAt : null)
          return {
            id: d.id,
            code: String(row.code || ''),
            label: String(row.label || ''),
            description: String(row.description || ''),
            type: row.type === 'percent_off' ? 'percent_off' : 'free_access',
            percentOff: Number(row.percentOff) || 100,
            planId: String(row.planId || ''),
            planName: String(row.planName || ''),
            benefitDurationMonths: Number(row.benefitDurationMonths) || 0,
            trialEnabled: Boolean(row.trialEnabled),
            maxRedemptions:
              row.maxRedemptions === null || row.maxRedemptions === undefined
                ? null
                : Number(row.maxRedemptions),
            usedCount: Number(row.usedCount) || 0,
            codeExpiresAt,
            status: String(row.status || 'active'),
            createdAt,
          }
        })
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      setCodes(rows)
      setError(null)
    } catch (fallbackErr) {
      console.error('[promo-codes] fallback load failed:', fallbackErr)
      setError(json.error || 'Failed to load promo codes')
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void loadCodes()
  }, [loadCodes])

  React.useEffect(() => {
    const applyPlans = (rows: PricingPlan[]) => {
      const active = rows.filter((p) => p.active !== false)
      setPlans(active)
      setForm((prev) =>
        prev.planId || active.length === 0 ? prev : { ...prev, planId: active[0].id }
      )
    }

    let unsubFallback: (() => void) | undefined
    const q = query(collection(db, 'pricingPlans'), orderBy('order', 'asc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        applyPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PricingPlan))
      },
      () => {
        unsubFallback = onSnapshot(
          collection(db, 'pricingPlans'),
          (snap) => {
            applyPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PricingPlan))
          },
          () => setPlans([])
        )
      }
    )
    return () => {
      unsub()
      unsubFallback?.()
    }
  }, [])

  const handleCreate = async () => {
    setError(null)
    if (!form.code.trim() || !form.planId) {
      setError('Code and pricing plan are required')
      return
    }
    setSaving(true)
    try {
      const json = await adminApiFetch<PromoRow>('/api/admin/promo-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code,
          label: form.label || form.code,
          description: form.description,
          type: 'free_access',
          percentOff: 100,
          planId: form.planId,
          benefitDurationMonths:
            form.benefitDurationMonths === 'forever' ? 0 : Number(form.benefitDurationMonths) || 1,
          trialEnabled: form.benefitDurationMonths !== 'forever' && form.trialEnabled,
          maxRedemptions: form.maxRedemptions.trim() === '' ? null : Number(form.maxRedemptions),
          codeExpiresAt: form.codeExpiresAt || null,
        }),
      })
      if (!json.success) {
        setError(json.error || 'Failed to create code')
        return
      }
      setForm({
        ...EMPTY_FORM,
        planId: plans[0]?.id || '',
      })
      setShowForm(false)
      await loadCodes()
    } finally {
      setSaving(false)
    }
  }

  const togglePause = async (row: PromoRow) => {
    const nextStatus = row.status === 'paused' ? 'active' : 'paused'
    const json = await adminApiFetch('/api/admin/promo-codes', {
      method: 'PATCH',
      body: JSON.stringify({ id: row.id, status: nextStatus }),
    })
    if (!json.success) {
      alert(json.error || 'Update failed')
      return
    }
    await loadCodes()
  }

  return (
    <AdminPageLayout
      title="Membership Promo Codes"
      subtitle="Create free-access membership codes (plan, duration 1–12 months or forever, expiry, redemption caps)."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            Codes grant 100% free access for forever or any duration from 1–12 months.
          </p>
          <button
            type="button"
            className={BUTTON_PRIMARY}
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={14} />
            {showForm ? 'Close' : 'New promo code'}
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}

        {showForm ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 space-y-4">
            <h3 className="font-semibold text-neutral-900">Create promo code</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Code</label>
                <input
                  className={INPUT_STYLE}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="FOUNDERS500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Label</label>
                <input
                  className={INPUT_STYLE}
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Founders free access"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 mb-1">Description</label>
                <input
                  className={INPUT_STYLE}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional admin note"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Valid for plan</label>
                <select
                  className={INPUT_STYLE}
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                >
                  <option value="">Select pricing plan…</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatPlanPrice(p)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Benefit duration
                </label>
                <select
                  className={INPUT_STYLE}
                  value={
                    form.benefitDurationMonths === 'forever'
                      ? 'forever'
                      : String(form.benefitDurationMonths)
                  }
                  onChange={(e) => {
                    const v = e.target.value
                    setForm({
                      ...form,
                      benefitDurationMonths: v === 'forever' ? 'forever' : Number(v) || 1,
                    })
                  }}
                >
                  <option value="forever">Forever (lifetime free)</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((months) => (
                    <option key={months} value={String(months)}>
                      {months} month{months === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Choose forever, or any duration from 1–12 months.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label
                  className={`flex items-start gap-2 rounded-lg border p-3 ${
                    form.benefitDurationMonths === 'forever'
                      ? 'border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed'
                      : 'border-neutral-200 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 cursor-pointer"
                    checked={form.trialEnabled && form.benefitDurationMonths !== 'forever'}
                    disabled={form.benefitDurationMonths === 'forever'}
                    onChange={(e) => setForm({ ...form, trialEnabled: e.target.checked })}
                  />
                  <span className="text-xs">
                    <span className="block font-medium text-neutral-900">
                      Enable real trial (card required, auto-bills via Stripe)
                    </span>
                    <span className="block text-neutral-500 mt-0.5">
                      On: the member enters a card at checkout and Stripe automatically bills the
                      plan price the moment the trial ends — a genuine free-trial-then-pay flow.
                      Off (default): the plan is granted directly for the duration above, no card
                      collected, no billing — access simply lapses when the duration is up.
                      {form.benefitDurationMonths === 'forever'
                        ? ' Not available for a forever/lifetime duration — there is nothing to bill.'
                        : ''}
                    </span>
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Max redemptions (blank = unlimited)
                </label>
                <input
                  className={INPUT_STYLE}
                  value={form.maxRedemptions}
                  onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Code expires (optional)
                </label>
                <input
                  type="datetime-local"
                  className={INPUT_STYLE}
                  value={form.codeExpiresAt}
                  onChange={(e) => setForm({ ...form, codeExpiresAt: e.target.value })}
                />
              </div>
            </div>
            <button
              type="button"
              className={BUTTON_PRIMARY}
              disabled={saving}
              onClick={() => void handleCreate()}
            >
              {saving ? 'Creating…' : 'Create promo code'}
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
            <p className="text-neutral-500">No promo codes yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((row) => (
              <div
                key={row.id}
                className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono font-bold text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded">
                      {row.code}
                    </code>
                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 capitalize">
                      {row.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-900">
                    {row.label || row.code} → {row.planName || row.planId}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {row.type === 'free_access' || row.percentOff >= 100
                      ? '100% free'
                      : `${row.percentOff}% off`}{' '}
                    ·{' '}
                    {row.benefitDurationMonths === 0
                      ? 'Forever'
                      : `${row.benefitDurationMonths} month${
                          row.benefitDurationMonths === 1 ? '' : 's'
                        }`}{' '}
                    · Used {row.usedCount}
                    {row.maxRedemptions != null ? ` / ${row.maxRedemptions}` : ' (unlimited)'}
                  </p>
                  {row.benefitDurationMonths > 0 ? (
                    <p className="text-xs">
                      {row.trialEnabled ? (
                        <span className="text-amber-700">
                          Real trial — card required, auto-bills via Stripe after {row.benefitDurationMonths}{' '}
                          month{row.benefitDurationMonths === 1 ? '' : 's'}
                        </span>
                      ) : (
                        <span className="text-neutral-500">Free grant only — no card, no billing</span>
                      )}
                    </p>
                  ) : null}
                  {row.codeExpiresAt ? (
                    <p className="text-xs text-neutral-500">
                      Code expires {format(new Date(row.codeExpiresAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  ) : null}
                  {row.description ? (
                    <p className="text-xs text-neutral-500">{row.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={BUTTON_PRIMARY}
                  onClick={() => void togglePause(row)}
                  disabled={row.status === 'exhausted' || row.status === 'expired'}
                >
                  {row.status === 'paused' ? (
                    <>
                      <Play size={14} /> Activate
                    </>
                  ) : (
                    <>
                      <Pause size={14} /> Pause
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
