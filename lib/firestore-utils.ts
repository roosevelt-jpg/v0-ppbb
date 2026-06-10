import { db } from './firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  QueryConstraint,
} from 'firebase/firestore'

// Generic Firestore operations
export async function getDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  try {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as T & { id: string }) : null
  } catch (error) {
    console.error(`[v0] Error fetching ${collectionName}/${docId}:`, error)
    return null
  }
}

export async function getCollection<T extends Record<string, any>>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    } as T & { id: string }))
  } catch (error) {
    console.error(`[v0] Error fetching ${collectionName}:`, error)
    return []
  }
}

export async function setDocument(
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId)
    await setDoc(docRef, data, { merge: false })
    return true
  } catch (error) {
    console.error(`[v0] Error setting ${collectionName}/${docId}:`, error)
    return false
  }
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  updates: Record<string, any>
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, updates)
    return true
  } catch (error) {
    console.error(`[v0] Error updating ${collectionName}/${docId}:`, error)
    return false
  }
}

export async function deleteDocument(collectionName: string, docId: string): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error(`[v0] Error deleting ${collectionName}/${docId}:`, error)
    return false
  }
}
