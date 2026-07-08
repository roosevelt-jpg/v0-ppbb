import type { BusinessProfile, User } from '@/lib/types'

type ProfileUser = Pick<
  User | BusinessProfile,
  'firstName' | 'lastName' | 'email' | 'phone' | 'profilePictureURL' | 'avatarUrl' | 'avatar'
> & {
  name?: string
  profilePicture?: string
}

/** Display name from Firestore user fields */
export function getUserDisplayName(user: ProfileUser | null | undefined): string {
  if (!user) return ''
  if (user.name?.trim()) return user.name.trim()
  const full = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  if (full) return full
  return user.email?.split('@')[0] || 'User'
}

/** Canonical profile picture URL with legacy fallbacks */
export function getUserProfilePictureURL(user: ProfileUser | null | undefined): string | null {
  if (!user) return null
  if (user.profilePictureURL?.trim()) return user.profilePictureURL.trim()
  if (user.avatarUrl?.trim()) return user.avatarUrl.trim()
  if (user.profilePicture?.trim()) return user.profilePicture.trim()
  if (user.avatar?.base64) return null
  return null
}

/** Initials for avatar fallback (up to 2 characters) */
export function getUserInitials(user: ProfileUser | null | undefined): string {
  const name = getUserDisplayName(user)
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/** Split a full name into first + last for Firestore */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const space = trimmed.indexOf(' ')
  if (space === -1) return { firstName: trimmed, lastName: '' }
  return {
    firstName: trimmed.slice(0, space).trim(),
    lastName: trimmed.slice(space + 1).trim(),
  }
}
