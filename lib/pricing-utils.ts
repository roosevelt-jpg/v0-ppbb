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
