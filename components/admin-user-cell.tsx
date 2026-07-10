'use client'

import React from 'react'
import { UserAvatar } from '@/components/user-avatar'
import { getUserDisplayName, getUserProfilePictureURL } from '@/lib/user-profile'

interface AdminUserCellProps {
  user?: {
    firstName?: string
    lastName?: string
    name?: string
    email?: string
    profilePictureURL?: string
    avatarUrl?: string
    profilePicture?: string
  } | null
  name?: string
  subtitle?: string
  hideSubtitle?: boolean
}

/** Name + circular avatar for admin user tables */
export function AdminUserCell({ user, name, subtitle, hideSubtitle }: AdminUserCellProps) {
  const displayName = name || getUserDisplayName(user)
  const picture = getUserProfilePictureURL(user)
  const sub = hideSubtitle ? undefined : subtitle || user?.email

  return (
    <div className="flex items-center gap-3 min-w-0">
      <UserAvatar user={user} size="sm" imageUrl={picture} name={displayName} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{displayName || 'Unknown'}</p>
        {sub ? <p className="text-xs text-gray-500 truncate">{sub}</p> : null}
      </div>
    </div>
  )
}
