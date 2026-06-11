import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, onSnapshot, QueryConstraint } from 'firebase/firestore'

/**
 * Get all active charity partners
 * Real-time listener version
 */
export function subscribeToActivePartners(callback: (partners: any[]) => void) {
  const q = query(collection(db, 'charityPartners'), where('status', '==', 'active'))
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    callback(data)
  })
}

/**
 * Get primary/default charity partner (first active one)
 */
export async function getPrimaryPartner() {
  const q = query(collection(db, 'charityPartners'), where('status', '==', 'active'))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data(),
  }
}

/**
 * Get specific partner by ID (real-time)
 */
export function subscribeToPartner(partnerId: string, callback: (partner: any | null) => void) {
  const q = query(collection(db, 'charityPartners'), where('status', '==', 'active'))
  return onSnapshot(q, (snapshot) => {
    const partner = snapshot.docs.find((doc) => doc.id === partnerId)
    if (partner) {
      callback({
        id: partner.id,
        ...partner.data(),
      })
    } else {
      callback(null)
    }
  })
}

/**
 * Get all active causes with real-time updates
 */
export function subscribeToActiveCauses(callback: (causes: any[]) => void) {
  const q = query(collection(db, 'causes'), where('status', '==', 'active'))
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    callback(data)
  })
}

/**
 * Get all donation submissions for a specific user (real-time)
 */
export function subscribeToUserDonations(userId: string, callback: (donations: any[]) => void) {
  const q = query(collection(db, 'donationSubmissions'), where('userId', '==', userId))
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    callback(data)
  })
}

/**
 * Get pending donation verifications (admin only)
 */
export function subscribeToPendingDonations(callback: (donations: any[]) => void) {
  const q = query(collection(db, 'donationSubmissions'), where('status', '==', 'pending'))
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    // Sort by most recent first
    data.sort((a, b) => (b.submittedAt?.toDate?.() || 0) - (a.submittedAt?.toDate?.() || 0))
    callback(data)
  })
}
