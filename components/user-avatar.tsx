'use client'

import React from 'react'
import { User as UserIcon } from 'lucide-react'
import { getUserDisplayName, getUserInitials, getUserProfilePictureURL } from '@/lib/user-profile'
import type { BusinessProfile, User } from '@/lib/types'

type AvatarUser = User | BusinessProfile | null | undefined

interface UserAvatarProps {
  user: AvatarUser
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  imageUrl?: string | null
  name?: string
}

const sizeMap = {
  xs: { box: 'h-6 w-6', text: 'text-[10px]', icon: 'h-3 w-3' },
  sm: { box: 'h-8 w-8', text: 'text-xs', icon: 'h-4 w-4' },
  md: { box: 'h-9 w-9', text: 'text-sm', icon: 'h-5 w-5' },
  lg: { box: 'h-12 w-12', text: 'text-base', icon: 'h-6 w-6' },
  xl: { box: 'h-24 w-24', text: 'text-2xl', icon: 'h-10 w-10' },
}

export function UserAvatar({ user, size = 'md', className = '', imageUrl, name }: UserAvatarProps) {
  const sizes = sizeMap[size]
  const url = imageUrl ?? getUserProfilePictureURL(user)
  const initials = getUserInitials(user ?? (name ? { name, firstName: name } : null))
  const displayName = name || getUserDisplayName(user)

  if (url) {
    return (
      <img
        src={url}
        alt={displayName}
        className={`${sizes.box} rounded-full object-cover shrink-0 border border-[#e4e1da] ${className}`}
      />
    )
  }

  if (initials && initials !== '?') {
    return (
      <span
        className={`${sizes.box} rounded-full shrink-0 inline-flex items-center justify-center font-semibold font-body ${sizes.text} bg-neutral-900 text-white ${className}`}
        aria-hidden
      >
        {initials}
      </span>
    )
  }

  return (
    <span
      className={`${sizes.box} rounded-full shrink-0 inline-flex items-center justify-center bg-neutral-200 text-neutral-600 ${className}`}
      aria-hidden
    >
      <UserIcon className={sizes.icon} />
    </span>
  )
}
