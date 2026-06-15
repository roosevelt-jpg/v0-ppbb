import { useAuth } from '@/lib/auth-context'
import { hasPermission, hasAnyPermission, hasAllPermissions, AdminPermission } from '@/lib/permissions'

/**
 * Hook to check user permissions
 */
export const usePermissions = () => {
  const { user } = useAuth()

  const check = (permission: AdminPermission): boolean => {
    if (!user) return false
    return hasPermission(user.permissions || [], permission)
  }

  const checkAny = (permissions: AdminPermission[]): boolean => {
    if (!user) return false
    return hasAnyPermission(user.permissions || [], permissions)
  }

  const checkAll = (permissions: AdminPermission[]): boolean => {
    if (!user) return false
    return hasAllPermissions(user.permissions || [], permissions)
  }

  return {
    check,
    checkAny,
    checkAll,
    canViewDashboard: check('dashboard.view'),
    canCreateForm: check('forms.create'),
    canEditForm: check('forms.edit'),
    canDeleteForm: check('forms.delete'),
    canViewSubmissions: check('forms.view_submissions'),
    canCreatePage: check('pages.create'),
    canEditPage: check('pages.edit'),
    canDeletePage: check('pages.delete'),
    canCreateFAQ: check('faqs.create'),
    canEditFAQ: check('faqs.edit'),
    canDeleteFAQ: check('faqs.delete'),
    canViewUsers: check('users.view'),
    canEditUsers: check('users.edit'),
    canDeleteUsers: check('users.delete'),
    canViewAnalytics: check('analytics.view'),
    canManageSettings: check('settings.manage'),
    canCreateAdmin: check('admin.create_admin'),
    canManagePermissions: check('admin.manage_permissions'),
    canDeleteAdmin: check('admin.delete_admin'),
    canManageAccessCodes: check('admin.manage_access_codes'),
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin'
  }
}
