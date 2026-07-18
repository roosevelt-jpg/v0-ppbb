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
  view_reports: [
    '/admin/analytics',
    '/admin/reporting',
    '/admin/finance',
    '/admin/referrals',
    '/admin/integration-analytics',
  ],
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
    '/admin/assets',
    '/admin/newsletters',
    '/admin/chatbot',
    '/admin/contact-submissions',
  ],
  manage_integrations: ['/admin/integrations'],
  manage_beneficiary: [
    '/admin/beneficiary-requests',
    '/admin/charity',
    '/admin/donation-verification',
    '/admin/donations',
    '/admin/charity-partners',
    '/admin/finance/donations',
  ],
  manage_members: [
    '/admin/members',
    '/admin/membership',
    '/admin/volunteers',
    '/admin/moderation',
    '/admin/businesses',
    '/admin/vendor-applications',
    '/admin/approvals',
    '/admin/pricing',
  ],
  manage_events: [
    '/admin/events',
    '/admin/workshops',
    '/admin/recordings',
    '/admin/opportunities',
    '/admin/marketplace',
    '/admin/communities',
    '/admin/finance/events',
  ],
  manage_admins: ['/admin/management', '/admin/security-center', '/admin/audit-logs'],
  manage_settings: [
    '/admin/cms/global-settings',
    '/admin/cms/global',
    '/admin/location-config',
    '/admin/health',
  ],
}

type PermissionUser = Pick<User, 'role' | 'permissions'> | null | undefined

/**
 * Resolve invite permissions for menu/route gating.
 * Explicit checked permissions always win. Empty list = role default
 * (matches Admin Management copy: "leave empty for full access").
 * Only `super_admin` is hard-gated to full access regardless of checkboxes.
 */
export function defaultPermissionsForInviteRole(role?: string): string[] {
  if (role === 'super_admin') return ['full_access']
  if (role === 'welfare' || role === 'founder' || role === 'coordinator') {
    return ['manage_beneficiary']
  }
  // admin | manager | founder_admin | moderator | unknown
  return ['full_access']
}

export function getEffectiveInvitePermissions(
  permissions: string[] | undefined,
  role?: string
): string[] {
  if (role === 'super_admin') return ['full_access']

  const selected = Array.isArray(permissions)
    ? permissions.map(String).map((p) => p.trim()).filter(Boolean)
    : []

  if (selected.length > 0) {
    if (selected.includes('full_access')) return ['full_access']
    return Array.from(new Set(selected))
  }

  return defaultPermissionsForInviteRole(role)
}

export function hasInvitePermission(
  user: PermissionUser,
  permission: InvitePermissionId
): boolean {
  if (!user) return false
  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return true
  return effective.includes(permission)
}

export function canAccessAdminPath(user: PermissionUser, pathname: string): boolean {
  if (!user) return false
  if (user.role === 'super_admin') return true

  const path = pathname.split('?')[0]
  if (path === '/admin/setup' || path === '/admin/login') return true

  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return true

  // Pure welfare-tier invites with only manage_beneficiary still reach /admin home
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

  // Welfare roles without an explicit broader permission set still keep beneficiary routes
  if (isWelfareOperationalRole(user.role) && !selectedHasNonWelfareScope(effective)) {
    const welfarePaths = [
      '/admin/beneficiary-requests',
      '/admin/charity',
      '/admin/donation-verification',
    ]
    if (welfarePaths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return true
    }
  }

  return false
}

function selectedHasNonWelfareScope(effective: string[]): boolean {
  return effective.some(
    (p) =>
      p !== 'manage_beneficiary' &&
      p !== 'full_access' &&
      Boolean(PERMISSION_ROUTE_PREFIXES[p as InvitePermissionId])
  )
}

export function filterAdminMenuByPermissions<
  T extends { href: string; label: string }
>(items: T[], user: PermissionUser): T[] {
  if (!user) return []
  if (user.role === 'super_admin') return items
  const effective = getEffectiveInvitePermissions(user.permissions, user.role)
  if (effective.includes('full_access')) return items
  return items.filter((item) => canAccessAdminPath(user, item.href))
}
