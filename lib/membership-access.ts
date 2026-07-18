const LEGACY_HARDCODED_TIERS = new Set([
  'standard',
  'gold',
  'platinum',
  'free',
  'premium',
  'enterprise',
  'basic',
  'partner',
])

/** Legacy enum values that used to be hardcoded on signup — not real pricing plan ids. */
export function isLegacyHardcodedTier(value: unknown): boolean {
  const key = String(value || '')
    .trim()
    .toLowerCase()
  return Boolean(key) && LEGACY_HARDCODED_TIERS.has(key)
}

function planNameLooksBusiness(name: string): boolean {
  const n = name.toLowerCase()
  return (
    n.includes('business') ||
    n.includes('partner') ||
    n.includes('corporate') ||
    n.includes('company')
  )
}

/** True when the profile has a real pricing-plan assignment (not just a hardcoded tier label). */
export function hasPricingPlanAssignment(user: Record<string, unknown> | null | undefined): boolean {
  if (!user) return false
  const planId = String(user.membershipPlanId || '').trim()
  if (planId && !isLegacyHardcodedTier(planId)) return true
  const planName = String(user.membershipPlanName || '').trim()
  if (planName) return true
  const tier = String(user.membershipTier || '').trim()
  if (tier && !isLegacyHardcodedTier(tier)) return true
  return false
}

/** Active paid/granted membership based on plan fields (not role alone). */
export function hasActiveMembership(user: Record<string, unknown> | null | undefined): boolean {
  if (!user || !hasPricingPlanAssignment(user)) return false
  const status = String(user.membershipStatus || '')
    .trim()
    .toLowerCase()
  if (
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'expired' ||
    status === 'pending_payment'
  ) {
    return false
  }
  if (user.membershipLifetimeForever === true) return true
  if (status === 'active') return true
  const renew = user.membershipRenewDate
  if (renew) {
    const d = renew instanceof Date ? renew : new Date(String(renew))
    if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) return true
  }
  return status === '' || status === 'active'
}

/**
 * Whether this profile’s assigned plan is a business plan.
 * Uses plan name heuristics (aligned with inferSignupTypeFromPlan).
 */
export function hasBusinessPricingPlan(user: Record<string, unknown> | null | undefined): boolean {
  if (!user || !hasPricingPlanAssignment(user)) return false
  const name = String(user.membershipPlanName || '').trim()
  if (name) return planNameLooksBusiness(name)
  const fallback =
    String(user.membershipPlanId || '').trim() || String(user.membershipTier || '').trim()
  if (!fallback || isLegacyHardcodedTier(fallback)) return false
  return planNameLooksBusiness(fallback)
}

/** Active business subscriber: real business plan + active membership. */
export function hasActiveBusinessMembership(
  user: Record<string, unknown> | null | undefined
): boolean {
  return hasActiveMembership(user) && hasBusinessPricingPlan(user)
}

/** Active individual/member subscriber. */
export function hasActiveMemberMembership(
  user: Record<string, unknown> | null | undefined
): boolean {
  return hasActiveMembership(user) && !hasBusinessPricingPlan(user)
}

/** Portal kind implied by the assigned pricing plan. */
export function portalKindFromPlan(
  user: Record<string, unknown> | null | undefined
): 'business' | 'member' | null {
  if (!hasPricingPlanAssignment(user)) return null
  return hasBusinessPricingPlan(user) ? 'business' : 'member'
}
