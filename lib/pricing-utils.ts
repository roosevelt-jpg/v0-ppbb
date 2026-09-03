import type { PricingPlan } from '@/lib/pricing-types'
import { isLegacyHardcodedTier } from '@/lib/membership-access'

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

/** Short list for cards — max items, prefers shorter feature lines. */
export function getPlanHighlightItems(
  plan: Pick<PricingPlan, 'features' | 'benefits'>,
  max = 4
): string[] {
  const items = getPlanIncludedItems(plan)
  return items
    .sort((a, b) => a.length - b.length)
    .slice(0, Math.max(1, max))
}

function normalizeTierKey(value: string): string {
  return value.trim().toLowerCase()
}

/** True when the member has an explicit pricing-plan assignment (not a legacy hardcoded tier). */
export function memberHasAssignedPlan(member: Record<string, unknown>): boolean {
  const planId = String(member.membershipPlanId || '').trim()
  if (planId && !isLegacyHardcodedTier(planId)) return true
  const planName = String(member.membershipPlanName || '').trim()
  if (planName) return true
  const tier = String(member.membershipTier || '').trim()
  return Boolean(tier) && !isLegacyHardcodedTier(tier)
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

/** Infer signup role from plan name (Individual → member, Business → business). */
export function inferSignupTypeFromPlan(
  plan: Pick<PricingPlan, 'name'>
): 'member' | 'business' {
  const name = String(plan.name || '').toLowerCase()
  if (
    name.includes('business') ||
    name.includes('partner') ||
    name.includes('corporate') ||
    name.includes('company')
  ) {
    return 'business'
  }
  return 'member'
}

export function formatPlanPriceDetailed(
  plan: Pick<PricingPlan, 'price' | 'currency' | 'billingPeriod'>
): { amount: string; period: string } {
  const amount = (Number(plan.price) || 0) / 100
  const currency = String(plan.currency || 'AED').toUpperCase()
  const period = plan.billingPeriod === 'yearly' ? 'yearly' : 'monthly'
  return {
    amount: `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`,
    period,
  }
}

/** Admin-configured free months before the first auto-debit (0–3). */
export function normalizePlanTrialMonths(value: unknown): 0 | 1 | 2 | 3 {
  const n = Math.floor(Number(value))
  if (n === 1 || n === 2 || n === 3) return n
  return 0
}

/** Calendar days Stripe should trial before charging the saved card. */
export function planTrialDays(plan: Pick<PricingPlan, 'trialMonths'>): number | undefined {
  const months = normalizePlanTrialMonths(plan.trialMonths)
  if (!months) return undefined
  const now = new Date()
  const end = new Date(now)
  end.setMonth(end.getMonth() + months)
  return Math.max(1, Math.round((end.getTime() - now.getTime()) / 86400000))
}

export function planTrialCopy(plan: Pick<PricingPlan, 'trialMonths'>): string | null {
  const months = normalizePlanTrialMonths(plan.trialMonths)
  if (!months) return null
  const period = months === 1 ? 'month' : 'months'
  return `First ${months} ${period} free — add a card now, billed after the trial`
}

export type ConfiguredGateways = { stripe: boolean; paypal: boolean; ziina: boolean }

/**
 * Pick the gateway to actually charge through: the plan's stated preference
 * if it's genuinely configured with credentials, otherwise the first
 * configured gateway (Stripe first) rather than sending the customer into a
 * checkout that's guaranteed to fail with "not configured". A plan record
 * can carry a payment_gateway value left over from a past Integrations
 * setup that's since been removed — this keeps checkout from breaking for
 * new signups when that happens instead of surfacing it only at checkout.
 */
export function resolveActiveGateway(
  plan: Pick<PricingPlan, 'paymentGateway'>,
  gateways: ConfiguredGateways
): 'stripe' | 'paypal' | 'ziina' | null {
  const preferred = plan.paymentGateway || 'stripe'
  if (gateways[preferred as keyof ConfiguredGateways]) return preferred as 'stripe' | 'paypal' | 'ziina'
  if (gateways.stripe) return 'stripe'
  if (gateways.paypal) return 'paypal'
  if (gateways.ziina) return 'ziina'
  return null
}
