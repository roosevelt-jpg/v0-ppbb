import { Timestamp } from 'firebase/firestore'

export type GenderRestriction = 'mixed' | 'men-only' | 'ladies-only'
export type CommunityStatus = 'active' | 'inactive' | 'archived'
export type GroupType = 'discussion' | 'support' | 'prayer' | 'skill-share' | 'networking'

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
  category: string
  tags: string[]
  genderRestriction: GenderRestriction
  isFeatured: boolean
  status: CommunityStatus

  memberCount: number
  groupCount: number

  createdBy: string
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
  timestamp: Timestamp | Date
  edited: boolean
  editedAt?: Timestamp | Date
  reactions: { emoji: string; users: string[] }[]
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
}
