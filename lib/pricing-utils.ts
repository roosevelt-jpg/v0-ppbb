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

/** Match a member record to a pricing plan (by plan ID, name, or legacy slug). */
export function memberMatchesPlan(
  member: Record<string, unknown>,
  plan: PricingPlan
): boolean {
  const assigned = normalizeTierKey(
    String(member.membershipPlanId || member.membershipTier || '')
  )

  if (!assigned) {
    return normalizeTierKey(plan.name) === 'standard'
  }

  const planId = normalizeTierKey(plan.id)
  const planName = normalizeTierKey(plan.name)
  const planSlug = planName.replace(/\s+/g, '-')

  return assigned === planId || assigned === planName || assigned === planSlug
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
