'use client'

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Event, EventRegistration, Payout, EventStatus } from '@/lib/event-types'
import {
  getEventStartDate,
  mapEventDoc,
  toEventDate,
  type NormalizedEvent,
} from '@/lib/event-utils'

// ─────────────────────────────────────────────────────────────────
// EVENTS QUERIES
// ─────────────────────────────────────────────────────────────────

export function subscribeToAllEvents(
  callback: (events: Event[]) => void,
  filters?: { status?: EventStatus; createdBy?: string }
) {
  const constraints: QueryConstraint[] = []

  if (filters?.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status))
  }
  if (filters?.createdBy) {
    constraints.push(where('createdBy', '==', filters.createdBy))
  }

  const q =
    constraints.length > 0
      ? query(collection(db, 'events'), ...constraints)
      : query(collection(db, 'events'))

  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[]
      events.sort((a, b) => {
        const aTime = toEventDate(a.createdAt)?.getTime() ?? 0
        const bTime = toEventDate(b.createdAt)?.getTime() ?? 0
        return bTime - aTime
      })
      callback(events)
    },
    (error) => {
      console.error('[v0] Error subscribing to events:', error)
      callback([])
    }
  )
}

/** Public events page — published events only, sorted by start date client-side. */
export function subscribeToPublishedEvents(
  callback: (events: NormalizedEvent[]) => void
): () => void {
  const q = query(collection(db, 'events'), where('status', '==', 'published'))

  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs
        .map((d) => mapEventDoc(d.id, d.data()))
        .sort((a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime())
      callback(events)
    },
    (error) => {
      console.error('[v0] Error subscribing to published events:', error)
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('index') || (error as { code?: string })?.code === 'failed-precondition') {
        console.error(
          '[v0] Firestore index may be required for published events query. Open Firebase Console → Firestore → Indexes and create a single-field index on events.status if prompted:',
          message
        )
      }
      callback([])
    }
  )
}

export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const docRef = doc(db, 'events', eventId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Event
    }
    return null
  } catch (error) {
    console.error('[v0] Error fetching event:', error)
    return null
  }
}

export async function createEvent(eventData: Omit<Event, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'events'), {
      ...eventData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('[v0] Error creating event:', error)
    throw error
  }
}

export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
  try {
    const eventRef = doc(db, 'events', eventId)
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('[v0] Error updating event:', error)
    throw error
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId))
  } catch (error) {
    console.error('[v0] Error deleting event:', error)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────────
// REGISTRATIONS QUERIES
// ─────────────────────────────────────────────────────────────────

export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  try {
    const q = query(
      collection(db, 'events', eventId, 'registrations'),
      orderBy('registeredAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EventRegistration[]
  } catch (error) {
    console.error('[v0] Error fetching registrations:', error)
    return []
  }
}

export function subscribeToEventRegistrations(
  eventId: string,
  callback: (registrations: EventRegistration[]) => void
) {
  const q = query(
    collection(db, 'events', eventId, 'registrations'),
    orderBy('registeredAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const registrations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EventRegistration[]
    callback(registrations)
  })
}

export async function addEventRegistration(
  eventId: string,
  registration: Omit<EventRegistration, 'id'>
): Promise<string> {
  try {
    const docRef = await addDoc(
      collection(db, 'events', eventId, 'registrations'),
      {
        ...registration,
        registeredAt: Timestamp.now(),
      }
    )
    return docRef.id
  } catch (error) {
    console.error('[v0] Error adding registration:', error)
    throw error
  }
}

export async function updateEventRegistration(
  eventId: string,
  registrationId: string,
  updates: Partial<EventRegistration>
): Promise<void> {
  try {
    const regRef = doc(db, 'events', eventId, 'registrations', registrationId)
    await updateDoc(regRef, updates)
  } catch (error) {
    console.error('[v0] Error updating registration:', error)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────────
// PAYOUTS QUERIES
// ─────────────────────────────────────────────────────────────────

export async function getPayouts(filters?: {
  status?: string
  businessId?: string
}): Promise<Payout[]> {
  try {
    const constraints: QueryConstraint[] = []

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status))
    }
    if (filters?.businessId) {
      constraints.push(where('businessId', '==', filters.businessId))
    }

    constraints.push(orderBy('initiatedAt', 'desc'))

    const q = query(collection(db, 'payouts'), ...constraints)
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Payout[]
  } catch (error) {
    console.error('[v0] Error fetching payouts:', error)
    return []
  }
}

export function subscribeToPayouts(
  callback: (payouts: Payout[]) => void,
  filters?: { status?: string; businessId?: string }
) {
  const constraints: QueryConstraint[] = []

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status))
  }
  if (filters?.businessId) {
    constraints.push(where('businessId', '==', filters.businessId))
  }

  constraints.push(orderBy('initiatedAt', 'desc'))

  const q = query(collection(db, 'payouts'), ...constraints)

  return onSnapshot(q, (snapshot) => {
    const payouts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Payout[]
    callback(payouts)
  })
}

export async function createPayout(payoutData: Omit<Payout, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'payouts'), {
      ...payoutData,
      initiatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('[v0] Error creating payout:', error)
    throw error
  }
}

export async function updatePayout(payoutId: string, updates: Partial<Payout>): Promise<void> {
  try {
    const payoutRef = doc(db, 'payouts', payoutId)
    await updateDoc(payoutRef, {
      ...updates,
      ...(updates.status === 'completed' && { completedAt: Timestamp.now() }),
    })
  } catch (error) {
    console.error('[v0] Error updating payout:', error)
    throw error
  }
}
