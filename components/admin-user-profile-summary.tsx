'use client'

import React from 'react'
import { UserAvatar } from '@/components/user-avatar'
import { formatUserPhoneDisplay, getUserDisplayName } from '@/lib/user-profile'
import type { BusinessProfile, User } from '@/lib/types'

type ProfileSubject = Partial<User | BusinessProfile> & {
  name?: string
  email?: string
}

interface AdminUserProfileSummaryProps {
  user: ProfileSubject | null | undefined
  /** Override display name (e.g. business owner name) */
  name?: string
  className?: string
}

/** Read-only admin profile header — avatar, name, email, and phone together */
export function AdminUserProfileSummary({
  user,
  name,
  className = '',
}: AdminUserProfileSummaryProps) {
  const displayName = name || getUserDisplayName(user)
  const email = user?.email?.trim() || 'Not provided'
  const phone = formatUserPhoneDisplay(user)

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 ${className}`.trim()}>
      <UserAvatar user={user as User | BusinessProfile} size="lg" name={displayName} />
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="font-headline text-xl sm:text-2xl font-bold text-neutral-900 truncate">
          {displayName || 'Unknown user'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm font-body">
          <p className="text-neutral-600 min-w-0">
            <span className="eyebrow text-neutral-500 mr-2">Email</span>
            <span className="text-neutral-900 break-all">{email}</span>
          </p>
          <p className="text-neutral-600 min-w-0">
            <span className="eyebrow text-neutral-500 mr-2">Phone</span>
            <span className="text-neutral-900">{phone}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
