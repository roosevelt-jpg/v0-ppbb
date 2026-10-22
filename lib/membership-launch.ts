/**
 * Paid membership plans, card checkout, and members-only gates stay in the
 * product. Turn this on when we are ready to charge again.
 */
export const MEMBERSHIP_PAYMENTS_ENABLED = false

export function freeMembershipFields(memberType: string) {
  const business = memberType === 'business'
  const label = business ? 'Business' : 'Individual'
  const id = business ? 'business-free' : 'individual-free'
  return {
    membershipStatus: 'active' as const,
    membershipLifetimeForever: true,
    membershipAutoRenew: false,
    membershipPlanName: label,
    membershipPlanId: id,
    membershipTier: id,
    membershipRenewDate: null,
  }
}
