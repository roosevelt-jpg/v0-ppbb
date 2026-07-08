'use client'

import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export interface TeamMember {
  id: string
  name: string
  title: string
  photoURL: string | null
  bio: string | null
  isActive: boolean
  order: number
}

export const DEFAULT_TEAM_MEMBERS: Omit<TeamMember, 'id'>[] = [
  {
    name: 'Yusef Bouattoura',
    title: 'Founder & Chief Executive Officer',
    photoURL: null,
    bio: null,
    isActive: true,
    order: 0,
  },
  {
    name: 'Dontai Anton',
    title: 'Chief Operating Officer',
    photoURL: null,
    bio: null,
    isActive: true,
    order: 1,
  },
  {
    name: 'Maimuna Rashid',
    title: 'Director of Strategy & Partnerships',
    photoURL: null,
    bio: null,
    isActive: true,
    order: 2,
  },
  {
    name: 'Arwa Abboud',
    title: 'Director of Community Programs (Sisters)',
    photoURL: null,
    bio: null,
    isActive: true,
    order: 3,
  },
  {
    name: 'Rhys Marshall',
    title: 'Director of Community Programs (Brothers)',
    photoURL: null,
    bio: null,
    isActive: true,
    order: 4,
  },
  {
    name: 'Abbey Potts',
    title: 'Director of Spiritual Growth & Personal Development',
    photoURL: null,
    bio: null,
    isActive: true,
    order: 5,
  },
  {
    name: 'Dounia H',
    title: 'Director of Admin, Finance & Compliance',
    photoURL: null,
    bio: null,
    isActive: true,
    order: 6,
  },
]

function mapTeamMemberDoc(id: string, data: Record<string, unknown>): TeamMember {
  const legacyPublished = data.status === 'published'
  const isActive =
    data.isActive === true || (data.isActive === undefined && (legacyPublished || data.status == null))

  return {
    id,
    name: typeof data.name === 'string' ? data.name : '',
    title:
      typeof data.title === 'string'
        ? data.title
        : typeof data.role === 'string'
          ? data.role
          : '',
    photoURL:
      typeof data.photoURL === 'string'
        ? data.photoURL
        : typeof data.imageUrl === 'string'
          ? data.imageUrl
          : typeof data.image === 'string'
            ? data.image
            : null,
    bio: typeof data.bio === 'string' ? data.bio : null,
    isActive,
    order: typeof data.order === 'number' ? data.order : 0,
  }
}

export function getTeamInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function subscribeToActiveTeamMembers(
  callback: (members: TeamMember[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'teamMembers'),
      (snapshot) => {
        const members = snapshot.docs
          .map((d) => mapTeamMemberDoc(d.id, d.data()))
          .filter((m) => m.isActive && m.name)
          .sort((a, b) => a.order - b.order)
        callback(members)
      },
      () => callback([])
    )
  } catch {
    callback([])
    return () => {}
  }
}

export function subscribeToAllTeamMembers(callback: (members: TeamMember[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'teamMembers'),
      (snapshot) => {
        const members = snapshot.docs
          .map((d) => mapTeamMemberDoc(d.id, d.data()))
          .sort((a, b) => a.order - b.order)
        callback(members)
      },
      () => callback([])
    )
  } catch {
    callback([])
    return () => {}
  }
}
