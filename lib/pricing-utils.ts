import type { PricingPlan } from '@/lib/pricing-types'

/** Merge features + benefits into one deduped list (case-insensitive). */
export function getPlanIncludedItems(
  plan: Pick<PricingPlan, 'features' | 'benefits'>
): string[] {
  const merged: string[] = []
  const seen = new Set<string>()

  for (const item of [...(plan.features || []), ...(plan.benefits || [])]) {
    const trimmed = item.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(trimmed)
  }

  return merged
}

function normalizeTierKey(value: string): string {
  return value.trim().toLowerCase()
}

/** True when the member has an explicit plan/tier assignment on their profile. */
export function memberHasAssignedPlan(member: Record<string, unknown>): boolean {
  return !!(
    String(member.membershipPlanId || '').trim() || String(member.membershipTier || '').trim()
  )
}

/** Match a member record to a pricing plan (by plan ID, name, or legacy slug). */
export function memberMatchesPlan(
  member: Record<string, unknown>,
  plan: PricingPlan
): boolean {
  if (!memberHasAssignedPlan(member)) return false

  const assigned = normalizeTierKey(
    String(member.membershipPlanId || member.membershipTier || '')
  )

  const planId = normalizeTierKey(plan.id)
  const planName = normalizeTierKey(plan.name)
  const planSlug = planName.replace(/\s+/g, '-')

  return assigned === planId || assigned === planName || assigned === planSlug
}

export function countUnassignedMembers(members: Record<string, unknown>[]): number {
  return members.filter((member) => !memberHasAssignedPlan(member)).length
}

export function formatPlanPrice(plan: Pick<PricingPlan, 'price' | 'currency' | 'billingPeriod'>): string {
  const amount = (Number(plan.price) || 0) / 100
  const currency = String(plan.currency || 'AED').toUpperCase()
  const period = plan.billingPeriod === 'yearly' ? 'year' : 'month'
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}/${period}`
}

export function getMemberAssignedPlan(
  member: Record<string, unknown>,
  plans: PricingPlan[]
): PricingPlan | null {
  return plans.find((plan) => memberMatchesPlan(member, plan)) ?? null
}

export function countMembersForPlan(
  members: Record<string, unknown>[],
  plan: PricingPlan
): number {
  return members.filter((member) => memberMatchesPlan(member, plan)).length
}

export function getPlanDisplayLabel(plan: PricingPlan): string {
  return plan.name
}
