'use client'

import { useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { recordAdminAuditFromUser } from '@/lib/admin-audit'
import type { AuditLogInput } from '@/lib/audit-log-shared'

export type AdminAuditInput = Omit<
  AuditLogInput,
  'adminId' | 'adminEmail' | 'adminName' | 'adminRole'
>

/** Hook for logging admin mutations from client-side Firestore writes. */
export function useAdminAudit() {
  const { user } = useAuth()

  return useCallback(
    (input: AdminAuditInput) => {
      if (!user) return
      recordAdminAuditFromUser(user, input)
    },
    [user]
  )
}
