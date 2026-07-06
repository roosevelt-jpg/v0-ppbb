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
 * `business` role AND the 'member' role (golden rule: business users must be members),
 * or are an admin/super_admin (who can view everything).
 * 
 * For backward compatibility: also allows users with ONLY 'business' role
 * (legacy accounts before dual-role implementation) but logs a warning.
 */
export function hasBusinessAccess(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): boolean {
  const roles = getUserRoles(user)
  
  // Admins can always access
  if (roles.includes('admin') || roles.includes('super_admin')) {
    return true
  }
  
  // Business users must also have member role (ideal state)
  if (roles.includes('business') && roles.includes('member')) {
    return true
  }
  
  // Fallback for existing business users who only have 'business' role (pre-migration)
  if (roles.includes('business') && !roles.includes('member')) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[v0] Business user missing member role - should be migrated:',
        user
      )
    }
    return true // Allow access but log warning
  }
  
  return false
}

/** Whether the user has any admin-level access. */
export function hasAdminAccess(
  user: Pick<User, 'role' | 'roles'> | null | undefined
): boolean {
  const roles = getUserRoles(user)
  return roles.includes('admin') || roles.includes('super_admin')
}
