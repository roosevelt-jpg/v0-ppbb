import type { UserRole } from '@/lib/types'

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
  return roles.includes('admin') || roles.includes('super_admin')
}

export function hasBusinessAccessServer(user: { role?: unknown; roles?: unknown } | null): boolean {
  const roles = getUserRoles(user)
  if (roles.includes('admin') || roles.includes('super_admin')) return true
  return roles.includes('business')
}
