export interface FCMSettings {
  enabled: boolean
  newCommunityNotification: boolean
  newGroupMessageNotification: boolean
  newEventNotification: boolean
  newsletterNotification: boolean
  newGroupJoinedNotification: boolean
  businessAlertsNotification: boolean
}

export const DEFAULT_FCM_SETTINGS: FCMSettings = {
  enabled: true,
  newCommunityNotification: true,
  newGroupMessageNotification: true,
  newEventNotification: true,
  newsletterNotification: true,
  newGroupJoinedNotification: true,
  businessAlertsNotification: true,
}
