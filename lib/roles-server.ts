import type { UserRole } from '@/lib/types'

/** Keep in sync with lib/roles ADMIN_PANEL_ROLES / hasAdminAccess. */
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
 * Server-side mirror of lib/roles getUserRoles — keep identical semantics.
 * Used only in API routes / Admin SDK contexts.
 */
export function getUserRoles(user: {
  role?: unknown
  roles?: unknown
} | null | undefined): UserRole[] {
  if (!user) return []
  const all = new Set<UserRole>()
  if (typeof user.role === 'string' && user.role) {
    all.add(user.role as UserRole)
  }
  if (Array.isArray(user.roles)) {
    for (const r of user.roles) {
      if (typeof r === 'string') all.add(r as UserRole)
    }
  }
  return Array.from(all)
}

export function hasAdminAccessServer(user: { role?: unknown; roles?: unknown } | null): boolean {
  const roles = getUserRoles(user)
  return roles.some((role) => ADMIN_PANEL_ROLES.includes(role))
}

export function hasBusinessAccessServer(user: { role?: unknown; roles?: unknown } | null): boolean {
  const roles = getUserRoles(user)
  if (hasAdminAccessServer(user)) return true
  return roles.includes('business')
}
