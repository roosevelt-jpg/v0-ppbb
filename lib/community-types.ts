import { Timestamp } from 'firebase/firestore'

export type GenderRestriction = 'mixed' | 'male' | 'female'
export type CommunityStatus = 'active' | 'inactive' | 'archived' | 'pending_approval'
export type CommunityVisibility = 'public' | 'private' | 'restricted'
export type GroupType = 'discussion' | 'support' | 'prayer' | 'skill-share' | 'networking' | 'announcement'
export type CommunityCategory = 'general' | 'interest' | 'support' | 'events' | 'volunteer' | 'business' | 'charity'
export type MemberModerationStatus = 'active' | 'suspended' | 'banned' | 'removed'

export interface Member {
  id: string
  name: string
  email: string
  photoURL?: string
  joinedAt: Timestamp | Date
  role: 'admin' | 'moderator' | 'member'
  gender?: string
}

export interface Community {
  id?: string
  name: string
  description: string
  bannerURL: string
  logoURL?: string
  category: CommunityCategory
  tags: string[]
  genderRestriction: GenderRestriction
  visibility: CommunityVisibility
  rules: string[]
  isFeatured: boolean
  status: CommunityStatus

  memberCount: number
  groupCount: number

  createdBy: string
  businessId?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date

  members: Member[]
  moderators: string[]
  admins: string[]
}

export interface Group {
  id?: string
  communityId: string
  name: string
  description: string
  type: GroupType
  genderRestriction: GenderRestriction
  capacity?: number
  memberCount: number
  status: CommunityStatus

  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date

  members: Member[]
  moderators: string[]
  requiresApproval?: boolean
  iconURL?: string
}

export interface Message {
  id?: string
  communityId: string
  groupId: string
  senderId: string
  senderName: string
  senderPhoto?: string
  content: string
  imageURL?: string
  fileURL?: string
  fileName?: string
  timestamp: Timestamp | Date
  edited: boolean
  editedAt?: Timestamp | Date
  reactions: { emoji: string; users: string[] }[]
  readBy: { userId: string; readAt: Timestamp | Date }[]
  isDeleted?: boolean
  deletedAt?: Timestamp | Date
}

export interface UserPresence {
  userId: string
  userName: string
  groupId: string
  communityId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: Timestamp | Date
  isTyping?: boolean
}

export interface GroupMember {
  id?: string
  communityId: string
  groupId: string
  userId: string
  userName: string
  userEmail: string
  userPhoto?: string
  gender?: string
  joinedAt: Timestamp | Date
  role: 'admin' | 'moderator' | 'member'
  isActive: boolean
  joinStatus?: 'pending' | 'active' | 'rejected'
  memberStatus?: MemberModerationStatus
  suspendedUntil?: Timestamp | Date
}

export interface CommunityMember {
  id?: string
  communityId: string
  userId: string
  userName: string
  userEmail: string
  userPhoto?: string
  gender?: string
  joinedAt: Timestamp | Date
  role: 'admin' | 'moderator' | 'member'
  isActive: boolean
  /** Platform admin moderation */
  memberStatus?: MemberModerationStatus
  suspendedUntil?: Timestamp | Date
  moderationNotes?: string
}
