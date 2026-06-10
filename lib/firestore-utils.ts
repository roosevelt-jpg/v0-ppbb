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
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore'

// Generic Firestore operations
export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? (docSnap.data() as T) : null
  } catch (error) {
    console.error(`[v0] Error fetching ${collectionName}/${docId}:`, error)
    return null
  }
}

export async function getCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T))
  } catch (error) {
    console.error(`[v0] Error fetching ${collectionName}:`, error)
    return []
  }
}

export async function setDocument<T>(
  collectionName: string,
  docId: string,
  data: T
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

export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  updates: Partial<T>
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
