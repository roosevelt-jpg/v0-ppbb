import type { User, UserRole } from '@/lib/types'
import { isWelfareOperationalRole } from '@/lib/charity-cases'
import { hasActiveBusinessMembership } from '@/lib/membership-access'

const ADMIN_PANEL_ROLES: UserRole[] = [
  'admin',
  'super_admin',
  'welfare',
  'founder',
  'coordinator',
  'founder_admin',
  'manager',
]

/**
 * Returns all roles a user holds, combining the primary `role` field with the
 * optional `roles` array. Always includes the primary role.
 */
export function getUserRoles(user: Pick<User, 'role' | 'roles'> | null | undefined): UserRole[] {
  if (!user) return []
  const all = new Set<UserRole>()
  if (user.role) all.add(user.role)
  if (Array.isArray(user.roles)) {
    for (const r of user.roles) all.add(r)
  }
  return Array.from(all)
}

/** Whether the user holds a given role (primary or secondary). */
export function hasRole(
  user: Pick<User, 'role' | 'roles'> | null | undefined,
  role: UserRole
): boolean {
  return getUserRoles(user).includes(role)
}

/**
 * Whether the user can access the business portal.
 * True if they have the `business` role, an admin role, OR an active Business pricing plan
 * (plan is the source of truth — not a hardcoded role alone).
 */
export function hasBusinessAccess(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): boolean {
  const roles = getUserRoles(user)

  if (roles.includes('admin') || roles.includes('super_admin')) {
    return true
  }

  if (roles.includes('business')) {
    return true
  }

  return hasActiveBusinessMembership(user as Record<string, unknown> | null | undefined)
}

/** Whether the user has any admin-level access. */
export function hasAdminAccess(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): boolean {
  const roles = getUserRoles(user)
  return roles.some((role) => ADMIN_PANEL_ROLES.includes(role))
}

/** Whether the user is a welfare-tier operational admin (beneficiary docs). */
export function hasWelfareAdminAccess(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): boolean {
  const roles = getUserRoles(user)
  return roles.some((role) => isWelfareOperationalRole(role))
}

/** Basic members/volunteers without business or admin roles. */
export function isBasicMember(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): boolean {
  if (!user) return false
  return !hasAdminAccess(user) && !hasBusinessAccess(user)
}

/**
 * Encrypted buyer↔seller DM inbox path.
 * Real business operators use /business/messages; members and admins use
 * /dashboard/messages so public "Message" never opens the admin chatbot.
 */
export function getDmInboxPath(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): string {
  const roles = getUserRoles(user)
  if (roles.includes('business') && !hasAdminAccess(user)) {
    return '/business/messages'
  }
  return '/dashboard/messages'
}

/** Who may create events via UI/API. */
export function canCreateEvents(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): boolean {
  return hasAdminAccess(user) || hasBusinessAccess(user)
}

/** Admin can approve members for any group; business only for groups they created. */
export function canApproveGroupMembers(
  user: Pick<User, 'role' | 'roles' | 'id'> | null | undefined,
  groupCreatedBy?: string | null
): boolean {
  if (!user) return false
  if (hasAdminAccess(user)) return true
  if (hasBusinessAccess(user) && groupCreatedBy && user.id === groupCreatedBy) return true
  return false
}

/**
 * Part 10A — member dashboard paths a basic member may open.
 * Everything else under /dashboard must redirect (not only hide in the sidebar).
 */
export const MEMBER_DASHBOARD_ALLOWED_PREFIXES = [
  '/dashboard',
  '/dashboard/events',
  '/dashboard/donations',
  '/dashboard/volunteering',
  '/dashboard/charity',
  '/dashboard/charity-requests',
  '/dashboard/opportunities',
  '/dashboard/marketplace',
  '/dashboard/orders',
  '/dashboard/messages',
  '/dashboard/learning',
  '/dashboard/certificates',
  '/dashboard/assets',
  '/dashboard/membership',
  '/dashboard/settings',
  '/dashboard/profile',
  '/dashboard/community',
  '/dashboard/communities',
] as const

/** Business-portal paths that require hasBusinessAccess (excluding signup). */
export const BUSINESS_PORTAL_PREFIX = '/business'

export function isMemberDashboardPathAllowed(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const path = pathname.split('?')[0]
  if (path === '/dashboard') return true
  return MEMBER_DASHBOARD_ALLOWED_PREFIXES.some(
    (prefix) => prefix !== '/dashboard' && (path === prefix || path.startsWith(prefix + '/'))
  )
}

/** True when the path is a business portal feature (not signup / join). */
export function isBusinessPortalFeaturePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const path = pathname.split('?')[0]
  if (!path.startsWith('/business')) return false
  if (path === '/business/signup') return false
  return true
}

/** Paths that must never appear for basic members (admin-only surfaces). */
export const ADMIN_ONLY_PATH_PREFIXES = [
  '/admin',
  '/dashboard/recordings',
] as const
