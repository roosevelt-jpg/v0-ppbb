import { Timestamp } from 'firebase/firestore'

export type GenderRestriction = 'mixed' | 'men-only' | 'ladies-only'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

export interface EventLocation {
  address: string
  city: string
  coordinates: {
    latitude: number
    longitude: number
  }
  placeId: string
}

export interface Event {
  id?: string
  title: string
  description: string
  date: Timestamp | Date
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  location: EventLocation
  bannerImageUrl: string
  isPaid: boolean
  price?: number
  currency?: string
  genderRestriction: GenderRestriction
  dressCode: string
  logistics: string
  maxAttendees?: number
  status: EventStatus
  attendees: string[] // array of user IDs
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface EventAttendance {
  id?: string
  eventId: string
  userId: string
  status: 'attending' | 'declined'
  addedToCalendar?: boolean
  calendarProvider?: 'google' | 'microsoft' | 'apple'
  createdAt: Timestamp | Date
}

export interface CalendarIntegration {
  provider: 'google' | 'microsoft' | 'apple'
  userId: string
  accessToken: string
  refreshToken?: string
  expiresAt: Timestamp | Date
}
