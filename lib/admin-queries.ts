'use server'

import { db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
  Query,
  DocumentData,
} from 'firebase/firestore'

export interface QueryOptions {
  pageSize?: number
  orderByField?: string
  orderDirection?: 'asc' | 'desc'
  whereClause?: { field: string; operator: '==' | '<' | '>' | '<=' | '>=' | '!='; value: any }
  startAfterDoc?: DocumentData
}

// Unified query builder for admin collections
export async function queryCollection(
  collectionName: string,
  options: QueryOptions = {}
) {
  try {
    const { pageSize = 20, orderByField = 'createdAt', orderDirection = 'desc', whereClause, startAfterDoc } = options

    let q: Query = collection(db, collectionName)

    if (whereClause) {
      q = query(
        collection(db, collectionName),
        where(whereClause.field, whereClause.operator, whereClause.value),
        orderBy(orderByField, orderDirection),
        limit(pageSize + 1)
      )
    } else {
      q = query(collection(db, collectionName), orderBy(orderByField, orderDirection), limit(pageSize + 1))
    }

    const snapshot = await getDocs(q)
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return {
      data: docs.slice(0, pageSize),
      hasMore: docs.length > pageSize,
      cursor: docs.length > pageSize ? docs[pageSize - 1] : null,
    }
  } catch (error) {
    console.error(`[v0] Error querying ${collectionName}:`, error)
    return { data: [], hasMore: false, cursor: null }
  }
}

// Get single document
export async function getDocumentById(collectionName: string, documentId: string) {
  try {
    const docRef = doc(db, collectionName, documentId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      }
    }

    return null
  } catch (error) {
    console.error(`[v0] Error fetching document:`, error)
    return null
  }
}

// Update document
export async function updateDocument(
  collectionName: string,
  documentId: string,
  data: Record<string, any>
) {
  try {
    const docRef = doc(db, collectionName, documentId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })

    return { success: true }
  } catch (error) {
    console.error(`[v0] Error updating document:`, error)
    return { success: false, error }
  }
}

// Delete document
export async function deleteDocument(collectionName: string, documentId: string) {
  try {
    const docRef = doc(db, collectionName, documentId)
    await deleteDoc(docRef)

    return { success: true }
  } catch (error) {
    console.error(`[v0] Error deleting document:`, error)
    return { success: false, error }
  }
}

// Create document
export async function createDocument(collectionName: string, data: Record<string, any>) {
  try {
    const collectionRef = collection(db, collectionName)
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return { success: true, id: docRef.id }
  } catch (error) {
    console.error(`[v0] Error creating document:`, error)
    return { success: false, error }
  }
}

// Get statistics for a collection (count)
export async function getCollectionStats(collectionName: string) {
  try {
    const snapshot = await getDocs(collection(db, collectionName))
    return { count: snapshot.size }
  } catch (error) {
    console.error(`[v0] Error getting stats:`, error)
    return { count: 0 }
  }
}
