import type { FCMSettings } from '@/lib/fcm-settings'
import { DEFAULT_FCM_SETTINGS } from '@/lib/fcm-settings'
import type { LocationData, User } from '@/lib/types'

export type NotificationPreferenceKey =
  | 'emailNotifications'
  | 'pushNotifications'
  | 'eventReminders'
  | 'memberMessages'
  | 'systemAlerts'
  | 'newsletter'
  | 'communityUpdates'

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>

export type PrivacySettings = {
  showProfileToCommunity: boolean
  showInMemberDirectory: boolean
}

export type UserAccountStatus = 'active' | 'deleted' | 'suspended'

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  eventReminders: true,
  memberMessages: true,
  systemAlerts: true,
  newsletter: true,
  communityUpdates: true,
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showProfileToCommunity: true,
  showInMemberDirectory: true,
}

export { DEFAULT_FCM_SETTINGS }

type UserLike = Partial<User> & {
  notificationPreferences?: Partial<NotificationPreferences>
  privacySettings?: Partial<PrivacySettings>
  status?: UserAccountStatus
  newsletterOptOut?: boolean
}

export function mergeNotificationPreferences(
  prefs?: Partial<NotificationPreferences> | null
): NotificationPreferences {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(prefs || {}) }
}

export function mergePrivacySettings(prefs?: Partial<PrivacySettings> | null): PrivacySettings {
  return { ...DEFAULT_PRIVACY_SETTINGS, ...(prefs || {}) }
}

export function isAccountDeleted(user?: UserLike | null): boolean {
  if (!user) return false
  return user.status === 'deleted' || user.active === false
}

export function formatUserLocationDisplay(
  location?: LocationData | string | null,
  locationLabel?: string | null
): string {
  if (locationLabel?.trim()) return locationLabel.trim()
  if (!location) return ''
  if (typeof location === 'string') return location.trim()
  const parts = [location.area, location.city, location.emirate, location.country].filter(Boolean)
  return parts.join(', ')
}

export function buildLocationLabelUpdate(
  text: string,
  existingLocation?: LocationData | string | null
): { locationLabel: string; location?: LocationData | string } {
  const trimmed = text.trim()
  if (!trimmed) {
    return { locationLabel: '' }
  }
  if (existingLocation && typeof existingLocation === 'object') {
    return { locationLabel: trimmed, location: existingLocation }
  }
  return { locationLabel: trimmed, location: trimmed }
}

export function notificationPrefsToFcmSettings(
  prefs: NotificationPreferences
): FCMSettings {
  return {
    enabled: prefs.pushNotifications,
    newCommunityNotification: prefs.communityUpdates,
    newGroupMessageNotification: prefs.memberMessages,
    newEventNotification: prefs.eventReminders,
    newsletterNotification: prefs.newsletter,
    newGroupJoinedNotification: prefs.communityUpdates,
  }
}

export function fcmSettingsToNotificationPrefs(
  fcm: Partial<FCMSettings> | null | undefined,
  current?: Partial<NotificationPreferences>
): Partial<NotificationPreferences> {
  if (!fcm) return {}
  return {
    pushNotifications: fcm.enabled ?? current?.pushNotifications,
    communityUpdates:
      fcm.newCommunityNotification ?? fcm.newGroupJoinedNotification ?? current?.communityUpdates,
    memberMessages: fcm.newGroupMessageNotification ?? current?.memberMessages,
    eventReminders: fcm.newEventNotification ?? current?.eventReminders,
    newsletter: fcm.newsletterNotification ?? current?.newsletter,
  }
}

export type NotificationChannel = 'email' | 'push' | 'in_app'

export function shouldNotifyUser(
  user: UserLike | null | undefined,
  channel: NotificationChannel,
  kind: NotificationPreferenceKey
): boolean {
  if (!user || isAccountDeleted(user)) return false
  const prefs = mergeNotificationPreferences(user.notificationPreferences)

  if (kind === 'newsletter' && user.newsletterOptOut === true) return false

  if (channel === 'email') {
    if (!prefs.emailNotifications) return false
    return prefs[kind] ?? true
  }

  if (channel === 'push') {
    if (!prefs.pushNotifications) return false
    return prefs[kind] ?? true
  }

  // In-app notifications respect the matching preference flag
  return prefs[kind] ?? true
}

export function canShowInMemberDirectory(user: UserLike | null | undefined): boolean {
  if (!user || isAccountDeleted(user)) return false
  const privacy = mergePrivacySettings(user.privacySettings)
  return privacy.showInMemberDirectory
}

export function canShowProfileToCommunity(
  user: UserLike | null | undefined,
  viewerId?: string | null
): boolean {
  if (!user || isAccountDeleted(user)) return false
  if (viewerId && user.id === viewerId) return true
  const privacy = mergePrivacySettings(user.privacySettings)
  return privacy.showProfileToCommunity
}

export type PublicMemberProfile = {
  id: string
  firstName?: string
  lastName?: string
  displayName: string
  location?: string
  bio?: string
  profilePictureURL?: string | null
  hidden?: boolean
}

export function toPublicMemberProfile(
  userId: string,
  data: UserLike | null | undefined,
  viewerId?: string | null
): PublicMemberProfile {
  const visible = canShowProfileToCommunity({ ...data, id: userId }, viewerId)
  if (!visible) {
    return {
      id: userId,
      displayName: 'Private member',
      hidden: true,
    }
  }

  const firstName = data?.firstName
  const lastName = data?.lastName
  const displayName =
    `${firstName || ''} ${lastName || ''}`.trim() ||
    (data as { name?: string })?.name?.trim() ||
    'Member'

  return {
    id: userId,
    firstName,
    lastName,
    displayName,
    location: formatUserLocationDisplay(
      data?.location as LocationData | string | undefined,
      (data as { locationLabel?: string })?.locationLabel
    ),
    bio: data?.bio,
    profilePictureURL: data?.profilePictureURL || data?.avatarUrl || null,
  }
}

export function toDirectoryMember(
  userId: string,
  data: UserLike | null | undefined
): PublicMemberProfile | null {
  if (!canShowInMemberDirectory({ ...data, id: userId })) return null
  return toPublicMemberProfile(userId, data)
}

export function mapNotificationTypeToPreference(
  type?: string
): NotificationPreferenceKey {
  switch (type) {
    case 'job_approved':
    case 'listing_published':
      return 'systemAlerts'
    case 'group_join_approved':
    case 'group_join_rejected':
    case 'group_message':
      return 'memberMessages'
    case 'event_reminder':
    case 'event_registration':
      return 'eventReminders'
    case 'newsletter':
      return 'newsletter'
    case 'community_update':
    case 'group_joined':
      return 'communityUpdates'
    default:
      return 'systemAlerts'
  }
}
