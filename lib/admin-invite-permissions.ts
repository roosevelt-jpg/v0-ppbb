import type { User } from '@/lib/types'
import { isWelfareOperationalRole } from '@/lib/charity-cases'

/** Permission IDs used on /admin/management invitation form */
export type InvitePermissionId =
  | 'manage_members'
  | 'manage_events'
  | 'manage_admins'
  | 'manage_settings'
  | 'view_reports'
  | 'manage_content'
  | 'manage_integrations'
  | 'manage_beneficiary'
  | 'full_access'

/** Admin routes gated by each invite permission */
export const PERMISSION_ROUTE_PREFIXES: Record<InvitePermissionId, string[]> = {
  full_access: ['/admin'],
  view_reports: ['/admin/analytics', '/admin/reporting'],
  manage_content: [
    '/admin/cms',
    '/admin/faq',
    '/admin/pages',
    '/admin/policies',
    '/admin/team',
    '/admin/testimonials',
    '/admin/partners',
    '/admin/forms',
    '/admin/eu-data-protection',
    '/admin/youtube-config',
  ],
  manage_integrations: ['/admin/integrations'],
  manage_beneficiary: ['/admin/beneficiary-requests', '/admin/charity', '/admin/donation-verification'],
  manage_members: [
    '/admin/members',
    '/admin/membership',
    '/admin/volunteers',
    '/admin/moderation',
  ],
  manage_events: ['/admin/events', '/admin/workshops', '/admin/recordings'],
  manage_admins: ['/admin/management'],
  manage_settings: ['/admin/cms/global', '/admin/location-config', '/admin/health'],
}

export function getEffectiveInvitePermissions(
  permissions: string[] | undefined,
  role?: string
): string[] {
  if (role === 'super_admin') return ['full_access']
  if (role === 'founder_admin' || role === 'manager') {
    if (!permissions?.length) return ['full_access']
  }
  if (role === 'welfare' || role === 'founder' || role === 'coordinator') {
    if (!permissions?.length) return ['manage_beneficiary']
  }
  if (!permissions?.length) return ['full_access']
  return permissions
}

export function hasInvitePermission(
  user: Pick<User, 'role' | 'permissions'> | null | undefined,
  permission: InvitePermissionId
): boolean {
  if (!user) return false
  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return true
  return effective.includes(permission)
}

export function canAccessAdminPath(
  user: Pick<User, 'role' | 'permissions'> | null | undefined,
  pathname: string
): boolean {
  if (!user) return false
  if (user.role === 'super_admin') return true

  const path = pathname.split('?')[0]
  if (path === '/admin/setup' || path === '/admin/login') return true

  if (isWelfareOperationalRole(user.role)) {
    const welfarePaths = [
      '/admin',
      '/admin/beneficiary-requests',
      '/admin/charity',
      '/admin/donation-verification',
    ]
    if (user.role === 'founder_admin' || user.role === 'manager') {
      // Broader operational access for founder_admin / manager invites
      const effective = getEffectiveInvitePermissions(user.permissions, user.role)
      if (effective.includes('full_access')) return true
    }
    return welfarePaths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  }

  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return true

  if (path === '/admin') {
    return effective.length > 0
  }

  for (const perm of effective) {
    const prefixes = PERMISSION_ROUTE_PREFIXES[perm as InvitePermissionId]
    if (!prefixes) continue
    if (prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return true
    }
  }

  return false
}

export function filterAdminMenuByPermissions<
  T extends { href: string; label: string }
>(items: T[], user: Pick<User, 'role' | 'permissions'> | null | undefined): T[] {
  if (!user) return []
  if (user.role === 'super_admin') return items
  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return items
  return items.filter((item) => canAccessAdminPath(user, item.href))
}
