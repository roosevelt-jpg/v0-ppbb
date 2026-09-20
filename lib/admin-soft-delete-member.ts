'use client'

import { auth } from '@/lib/firebase'
import { isAccountDeleted } from '@/lib/user-settings'

/** Soft-delete a member/volunteer via Admin SDK (same path as Individual Members). */
export async function softDeleteMemberAccount(userId: string): Promise<{
  success: boolean
  error?: string
  alreadyDeleted?: boolean
}> {
  const id = String(userId || '').trim()
  if (!id) return { success: false, error: 'Missing user id' }

  try {
    const token = await auth.currentUser?.getIdToken()
    if (!token) return { success: false, error: 'Sign in again to delete accounts' }

    const res = await fetch('/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'bulk-delete', ids: [id] }),
    })
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean
      error?: string
      count?: number
      message?: string
    }

    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Failed to delete account' }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete account',
    }
  }
}

export function isDeletedVolunteerRow(row: Record<string, unknown> | null | undefined): boolean {
  return isAccountDeleted(row as { status?: string; active?: boolean; accountDeleted?: boolean })
}
