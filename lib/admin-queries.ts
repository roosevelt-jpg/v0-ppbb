'use server'

import { headers } from 'next/headers'
import { db } from '@/lib/firebase'
import { writeAuditLogServer } from '@/lib/audit-log-server'
import {
  formatAdminRoleLabel,
  getAuditContextFromHeaders,
  type AuditActionType,
  type AuditEntityType,
} from '@/lib/audit-log-shared'
import { getUserDisplayName } from '@/lib/user-profile'
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

export type AdminMutationAudit = {
  adminId: string
  adminEmail?: string
  adminName?: string
  adminRole?: string
  actionType: AuditActionType
  action: string
  entityType: AuditEntityType | string
  entityId?: string
  entityName?: string
  status?: 'success' | 'failed'
  details?: string
}

async function writeServerActionAudit(audit?: AdminMutationAudit) {
  if (!audit?.adminId) return
  try {
    const headersList = await headers()
    const ctx = getAuditContextFromHeaders(headersList)
    await writeAuditLogServer({
      adminId: audit.adminId,
      adminEmail: audit.adminEmail || 'unknown',
      adminName: audit.adminName || getUserDisplayName(audit as Parameters<typeof getUserDisplayName>[0]),
      adminRole: formatAdminRoleLabel(audit.adminRole || 'admin'),
      actionType: audit.actionType,
      action: audit.action,
      entityType: audit.entityType,
      entityId: audit.entityId,
      entityName: audit.entityName,
      status: audit.status || 'success',
      details: audit.details,
      ...ctx,
    })
  } catch (error) {
    console.warn('[v0] writeServerActionAudit failed (non-blocking):', error)
  }
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
  data: Record<string, any>,
  audit?: AdminMutationAudit
) {
  try {
    const docRef = doc(db, collectionName, documentId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    })

    await writeServerActionAudit(
      audit
        ? { ...audit, entityId: audit.entityId || documentId, status: audit.status || 'success' }
        : undefined
    )

    return { success: true }
  } catch (error) {
    console.error(`[v0] Error updating document:`, error)
    return { success: false, error }
  }
}

// Delete document
export async function deleteDocument(
  collectionName: string,
  documentId: string,
  audit?: AdminMutationAudit
) {
  try {
    const docRef = doc(db, collectionName, documentId)
    await deleteDoc(docRef)

    await writeServerActionAudit(
      audit
        ? { ...audit, entityId: audit.entityId || documentId, status: audit.status || 'success' }
        : undefined
    )

    return { success: true }
  } catch (error) {
    console.error(`[v0] Error deleting document:`, error)
    return { success: false, error }
  }
}

// Create document
export async function createDocument(
  collectionName: string,
  data: Record<string, any>,
  audit?: AdminMutationAudit
) {
  try {
    const collectionRef = collection(db, collectionName)
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    await writeServerActionAudit(
      audit
        ? { ...audit, entityId: audit.entityId || docRef.id, status: audit.status || 'success' }
        : undefined
    )

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
