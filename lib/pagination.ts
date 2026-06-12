import { getFirestore, collection, query, Query, getDocs, startAfter, limit, QueryConstraint, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
})

const db = getFirestore(app)

export interface PaginatedResult<T> {
  items: T[]
  nextCursor?: QueryDocumentSnapshot<DocumentData>
  hasMore: boolean
  count: number
}

/**
 * Fetch paginated results from Firestore
 */
export async function paginateQuery<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  pageSize: number = 20,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResult<T>> {
  try {
    const queryConstraints = cursor 
      ? [...constraints, startAfter(cursor), limit(pageSize + 1)]
      : [...constraints, limit(pageSize + 1)]

    const q = query(collection(db, collectionName), ...queryConstraints)
    const snapshot = await getDocs(q)
    
    const docs = snapshot.docs
    const hasMore = docs.length > pageSize
    const items = docs.slice(0, pageSize)

    return {
      items: items.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string })),
      nextCursor: hasMore ? docs[pageSize] : undefined,
      hasMore,
      count: items.length,
    }
  } catch (error) {
    console.error('[v0] Error paginating query:', error)
    return { items: [], hasMore: false, count: 0 }
  }
}

/**
 * Get total count of documents in a collection
 * Note: This requires a count aggregation index in Firestore
 */
export async function getCollectionCount(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<number> {
  try {
    const q = query(collection(db, collectionName), ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error('[v0] Error counting documents:', error)
    return 0
  }
}
