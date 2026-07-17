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
  /** Allow others to open your full community profile */
  showProfileToCommunity: boolean
  /** Appear in the public/business member directory */
  showInMemberDirectory: boolean
  /** Show avatar in group chat / forum */
  showAvatarInGroups: boolean
  /** Show real name in group chat / forum (otherwise “Member”) */
  showRealNameInGroups: boolean
  /** Include bio on your community profile */
  showBioOnProfile: boolean
  /** Include location on your community profile */
  showLocationOnProfile: boolean
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
  showAvatarInGroups: true,
  showRealNameInGroups: true,
  showBioOnProfile: true,
  showLocationOnProfile: true,
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
  return (
    user.status === 'deleted' ||
    user.active === false ||
    Boolean((user as { accountDeleted?: boolean }).accountDeleted)
  )
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
  canViewFullProfile?: boolean
  showAvatar?: boolean
  showRealName?: boolean
}

export type GroupChatIdentity = {
  id: string
  displayName: string
  profilePictureURL: string | null
  canOpenProfile: boolean
}

export function toPublicMemberProfile(
  userId: string,
  data: UserLike | null | undefined,
  viewerId?: string | null
): PublicMemberProfile {
  const isSelf = Boolean(viewerId && userId === viewerId)
  const privacy = mergePrivacySettings(data?.privacySettings)
  const visible = isSelf || canShowProfileToCommunity({ ...data, id: userId }, viewerId)

  if (!visible) {
    return {
      id: userId,
      displayName: 'Private member',
      hidden: true,
      canViewFullProfile: false,
      showAvatar: false,
      showRealName: false,
      profilePictureURL: null,
    }
  }

  const firstName = data?.firstName
  const lastName = data?.lastName
  const fullName =
    `${firstName || ''} ${lastName || ''}`.trim() ||
    (data as { name?: string })?.name?.trim() ||
    'Member'

  const showRealName = isSelf || privacy.showRealNameInGroups
  const showAvatar = isSelf || privacy.showAvatarInGroups
  const showBio = isSelf || privacy.showBioOnProfile
  const showLocation = isSelf || privacy.showLocationOnProfile

  return {
    id: userId,
    firstName: showRealName ? firstName : undefined,
    lastName: showRealName ? lastName : undefined,
    displayName: showRealName ? fullName : 'Member',
    location: showLocation
      ? formatUserLocationDisplay(
          data?.location as LocationData | string | undefined,
          (data as { locationLabel?: string })?.locationLabel
        )
      : undefined,
    bio: showBio ? data?.bio : undefined,
    profilePictureURL: showAvatar
      ? data?.profilePictureURL || data?.avatarUrl || null
      : null,
    hidden: false,
    canViewFullProfile: true,
    showAvatar,
    showRealName,
  }
}

/** Live display identity for group chat / forum (respects privacy). */
export function toGroupChatIdentity(
  userId: string,
  data: UserLike | null | undefined,
  viewerId?: string | null
): GroupChatIdentity {
  const profile = toPublicMemberProfile(userId, data, viewerId)
  return {
    id: userId,
    displayName: profile.displayName,
    profilePictureURL: profile.profilePictureURL || null,
    canOpenProfile: profile.canViewFullProfile === true && profile.hidden !== true,
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
    case 'community_joined':
      return 'communityUpdates'
    case 'event_created':
      return 'eventReminders'
    case 'job_application':
    case 'marketplace_purchase':
    case 'offer_approved':
      return 'systemAlerts'
    default:
      return 'systemAlerts'
  }
}
