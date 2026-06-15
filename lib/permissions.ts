/**
 * Role-based permission system for admin dashboard
 */

export type AdminPermission = 
  | 'admin.create_admin'
  | 'admin.manage_users'
  | 'admin.manage_permissions'
  | 'admin.view_all'
  | 'admin.create_access_codes'
  | 'admin.manage_access_codes'
  | 'admin.manage_roles'
  | 'admin.delete_admin'
  | 'dashboard.view'
  | 'forms.create'
  | 'forms.edit'
  | 'forms.delete'
  | 'forms.view_submissions'
  | 'pages.create'
  | 'pages.edit'
  | 'pages.delete'
  | 'faqs.create'
  | 'faqs.edit'
  | 'faqs.delete'
  | 'users.view'
  | 'users.edit'
  | 'users.delete'
  | 'analytics.view'
  | 'settings.manage'

export interface AdminRole {
  id: string
  name: string
  description: string
  permissions: AdminPermission[]
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// Default admin roles
export const DEFAULT_ADMIN_ROLES: Record<string, AdminRole> = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: [
      'admin.create_admin',
      'admin.manage_users',
      'admin.manage_permissions',
      'admin.view_all',
      'admin.create_access_codes',
      'admin.manage_access_codes',
      'admin.manage_roles',
      'admin.delete_admin',
      'dashboard.view',
      'forms.create',
      'forms.edit',
      'forms.delete',
      'forms.view_submissions',
      'pages.create',
      'pages.edit',
      'pages.delete',
      'faqs.create',
      'faqs.edit',
      'faqs.delete',
      'users.view',
      'users.edit',
      'users.delete',
      'analytics.view',
      'settings.manage'
    ],
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'Can manage forms, pages, FAQs and content',
    permissions: [
      'dashboard.view',
      'forms.create',
      'forms.edit',
      'forms.delete',
      'forms.view_submissions',
      'pages.create',
      'pages.edit',
      'pages.delete',
      'faqs.create',
      'faqs.edit',
      'faqs.delete',
      'users.view',
      'analytics.view'
    ],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  moderator: {
    id: 'moderator',
    name: 'Moderator',
    description: 'Can view and moderate content',
    permissions: [
      'dashboard.view',
      'faqs.view',
      'forms.view_submissions',
      'users.view',
      'analytics.view'
    ],
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  viewer: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to dashboard and analytics',
    permissions: [
      'dashboard.view',
      'analytics.view'
    ],
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

/**
 * Check if user has a specific permission
 */
export const hasPermission = (permissions: AdminPermission[], permission: AdminPermission): boolean => {
  return permissions.includes(permission)
}

/**
 * Check if user has any of the given permissions
 */
export const hasAnyPermission = (permissions: AdminPermission[], requiredPermissions: AdminPermission[]): boolean => {
  return requiredPermissions.some(permission => permissions.includes(permission))
}

/**
 * Check if user has all of the given permissions
 */
export const hasAllPermissions = (permissions: AdminPermission[], requiredPermissions: AdminPermission[]): boolean => {
  return requiredPermissions.every(permission => permissions.includes(permission))
}

/**
 * Get readable permission name
 */
export const getPermissionLabel = (permission: AdminPermission): string => {
  const labels: Record<AdminPermission, string> = {
    'admin.create_admin': 'Create Admin Users',
    'admin.manage_users': 'Manage All Users',
    'admin.manage_permissions': 'Manage Permissions',
    'admin.view_all': 'View All Data',
    'admin.create_access_codes': 'Create Access Codes',
    'admin.manage_access_codes': 'Manage Access Codes',
    'admin.manage_roles': 'Manage Admin Roles',
    'admin.delete_admin': 'Delete Admin Users',
    'dashboard.view': 'View Dashboard',
    'forms.create': 'Create Forms',
    'forms.edit': 'Edit Forms',
    'forms.delete': 'Delete Forms',
    'forms.view_submissions': 'View Form Submissions',
    'pages.create': 'Create Pages',
    'pages.edit': 'Edit Pages',
    'pages.delete': 'Delete Pages',
    'faqs.create': 'Create FAQs',
    'faqs.edit': 'Edit FAQs',
    'faqs.delete': 'Delete FAQs',
    'users.view': 'View Users',
    'users.edit': 'Edit Users',
    'users.delete': 'Delete Users',
    'analytics.view': 'View Analytics',
    'settings.manage': 'Manage Settings'
  }
  return labels[permission] || permission
}

/**
 * Get permission category
 */
export const getPermissionCategory = (permission: AdminPermission): string => {
  if (permission.startsWith('admin.')) return 'Admin Management'
  if (permission.startsWith('forms.')) return 'Forms'
  if (permission.startsWith('pages.')) return 'Pages'
  if (permission.startsWith('faqs.')) return 'FAQs'
  if (permission.startsWith('users.')) return 'Users'
  if (permission.startsWith('analytics.')) return 'Analytics'
  if (permission.startsWith('settings.')) return 'Settings'
  return 'Other'
}
