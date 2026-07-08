'use client'

import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export interface TeamMember {
  id: string
  name: string
  title: string
  photoURL: string | null
  bio: string | null
  email: string | null
  whatsappNumber: string | null
  linkedinURL: string | null
  isActive: boolean
  order: number
}

type SeedMember = Omit<TeamMember, 'id'>

const emptyContacts = {
  photoURL: null as string | null,
  bio: null as string | null,
  email: null as string | null,
  whatsappNumber: null as string | null,
  linkedinURL: null as string | null,
  isActive: true,
}

export const DEFAULT_TEAM_MEMBERS: SeedMember[] = [
  {
    name: 'Yusef Bouattoura',
    title: 'Founder & Chief Executive Officer',
    ...emptyContacts,
    order: 0,
  },
  {
    name: 'Dontai Anton',
    title: 'Chief Operating Officer',
    ...emptyContacts,
    order: 1,
  },
  {
    name: 'Maimuna Rashid',
    title: 'Director of Strategy & Partnerships',
    ...emptyContacts,
    order: 2,
  },
  {
    name: 'Arwa Abboud',
    title: 'Director of Community Programs (Sisters)',
    ...emptyContacts,
    order: 3,
  },
  {
    name: 'Rhys Marshall',
    title: 'Director of Community Programs (Brothers)',
    ...emptyContacts,
    order: 4,
  },
  {
    name: 'Abbey Potts',
    title: 'Director of Spiritual Growth & Personal Development',
    ...emptyContacts,
    order: 5,
  },
  {
    name: 'Dounia H',
    title: 'Director of Admin, Finance & Compliance',
    ...emptyContacts,
    order: 6,
  },
]

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function mapTeamMemberDoc(id: string, data: Record<string, unknown>): TeamMember {
  const legacyPublished = data.status === 'published'
  const isActive =
    data.isActive === true ||
    (data.isActive === undefined && (legacyPublished || data.status == null))

  const social =
    data.socialLinks && typeof data.socialLinks === 'object'
      ? (data.socialLinks as Record<string, unknown>)
      : data.social && typeof data.social === 'object'
        ? (data.social as Record<string, unknown>)
        : {}

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
      optionalString(data.photoURL) ||
      optionalString(data.imageUrl) ||
      optionalString(data.image),
    bio: optionalString(data.bio),
    email: optionalString(data.email) || optionalString(social.email),
    whatsappNumber:
      optionalString(data.whatsappNumber) || optionalString(data.whatsapp),
    linkedinURL:
      optionalString(data.linkedinURL) ||
      optionalString(data.linkedin) ||
      optionalString(social.linkedin),
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

/** Normalize phone digits for wa.me links (keeps country code digits only). */
export function buildWhatsAppHref(whatsappNumber: string): string {
  const digits = whatsappNumber.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
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
