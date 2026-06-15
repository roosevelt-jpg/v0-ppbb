'use client'

import React from 'react'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { AdminPermission } from '@/lib/permissions'

interface PermissionGateProps {
  permission?: AdminPermission
  permissions?: AdminPermission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Component that conditionally renders content based on user permissions
 * 
 * Usage:
 * <PermissionGate permission="forms.create">
 *   <CreateFormButton />
 * </PermissionGate>
 * 
 * Or with multiple permissions:
 * <PermissionGate permissions={['forms.edit', 'forms.delete']} requireAll>
 *   <EditDeleteButtons />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}) => {
  const perms = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = perms.check(permission)
  } else if (permissions) {
    if (requireAll) {
      hasAccess = perms.checkAll(permissions)
    } else {
      hasAccess = perms.checkAny(permissions)
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
