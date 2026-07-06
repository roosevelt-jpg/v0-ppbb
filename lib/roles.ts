import type { User, UserRole } from '@/lib/types'

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
 * Whether the user can access the business portal. True if they have the
 * `business` role or are an admin/super_admin (who can view everything).
 * Business and member roles are completely separate.
 */
export function hasBusinessAccess(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): boolean {
  const roles = getUserRoles(user)
  
  // Admins can always access
  if (roles.includes('admin') || roles.includes('super_admin')) {
    return true
  }
  
  // Business users have 'business' role
  return roles.includes('business')
}

/** Whether the user has any admin-level access. */
export function hasAdminAccess(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): boolean {
  const roles = getUserRoles(user)
  return roles.includes('admin') || roles.includes('super_admin')
}
