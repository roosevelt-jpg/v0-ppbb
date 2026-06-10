import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Timestamp,
  writeBatch,
  Query,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore'
import {
  BeneficiarySupportRequest,
  SensitiveDocumentMetadata,
  BeneficiaryConsent,
  BeneficiaryAccessLog,
  AdminRole,
  AdminUser,
} from '@/lib/types'
import crypto from 'crypto'

// ============================================================================
// ACCESS CONTROL UTILITIES
// ============================================================================

// Define which roles can access beneficiary data
const BENEFICIARY_ACCESS_MATRIX: Record<AdminRole, {
  canView: boolean
  canApprove: boolean
  canDownloadDocuments: boolean
  territory?: string
}> = {
  founder_admin: { canView: true, canApprove: true, canDownloadDocuments: true },
  manager: { canView: true, canApprove: true, canDownloadDocuments: true, territory: 'all' },
  moderator: { canView: false, canApprove: false, canDownloadDocuments: false },
  analyst: { canView: true, canApprove: false, canDownloadDocuments: false },
}

export async function canViewBeneficiaryRequest(
  adminUser: AdminUser,
  request: BeneficiarySupportRequest
): Promise<boolean> {
  const access = BENEFICIARY_ACCESS_MATRIX[adminUser.adminRole]
  if (!access?.canView) return false
  
  // Check if role is in the request's visibleTo list
  return request.visibleTo.includes(adminUser.adminRole)
}

export async function canDownloadSensitiveDocument(
  adminUser: AdminUser,
  documentMetadata: SensitiveDocumentMetadata
): Promise<boolean> {
  const access = BENEFICIARY_ACCESS_MATRIX[adminUser.adminRole]
  return access?.canDownloadDocuments ?? false
}

export async function canApproveRequest(adminUser: AdminUser): Promise<boolean> {
  return BENEFICIARY_ACCESS_MATRIX[adminUser.adminRole]?.canApprove ?? false
}

// ============================================================================
// BENEFICIARY REQUEST OPERATIONS
// ============================================================================

export async function createBeneficiarySupportRequest(
  userId: string,
  requestData: Partial<BeneficiarySupportRequest>,
  consentData: BeneficiaryConsent
): Promise<{ requestId: string; consentId: string }> {
  try {
    const requestId = doc(collection(db, 'beneficiaryRequests')).id
    const consentId = doc(collection(db, 'beneficiaryConsents')).id

    // Save consent first
    await setDoc(doc(db, 'beneficiaryConsents', consentId), {
      ...consentData,
      id: consentId,
      beneficiaryRequestId: requestId,
      timestamp: Timestamp.now(),
    })

    // Determine access based on request details
    const visibleToRoles: AdminRole[] = ['founder_admin', 'manager']
    if (requestData.emergencyLevel === 'critical') {
      visibleToRoles.push('analyst') // Critical cases visible to analysts too
    }

    const canDownloadRoles: AdminRole[] = ['founder_admin', 'manager']

    // Create beneficiary request
    await setDoc(doc(db, 'beneficiaryRequests', requestId), {
      ...requestData,
      id: requestId,
      userId,
      consentLogId: consentId,
      visibleTo: visibleToRoles,
      canDownloadDocuments: canDownloadRoles,
      status: 'draft',
      submissionDate: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return { requestId, consentId }
  } catch (error) {
    console.error('[v0] Error creating beneficiary support request:', error)
    throw error
  }
}

export async function submitBeneficiarySupportRequest(
  requestId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'beneficiaryRequests', requestId), {
      status: 'submitted',
      submissionDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Log the action
    await logBeneficiaryAccess(requestId, 'submitted', 'request_submitted', {
      description: 'Beneficiary submitted support request',
    })
  } catch (error) {
    console.error('[v0] Error submitting beneficiary request:', error)
    throw error
  }
}

export async function getBeneficiarySupportRequest(
  requestId: string
): Promise<BeneficiarySupportRequest | null> {
  try {
    const docSnap = await getDoc(doc(db, 'beneficiaryRequests', requestId))
    if (!docSnap.exists()) return null
    return docSnap.data() as BeneficiarySupportRequest
  } catch (error) {
    console.error('[v0] Error fetching beneficiary request:', error)
    return null
  }
}

export async function getUserBeneficiaryRequests(
  userId: string,
  onDataChange?: (requests: BeneficiarySupportRequest[]) => void
): Promise<Unsubscribe | null> {
  try {
    const q = query(
      collection(db, 'beneficiaryRequests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    if (onDataChange) {
      return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map((doc) => doc.data() as BeneficiarySupportRequest)
        onDataChange(requests)
      })
    }

    const snapshot = await getDocs(q)
    return null
  } catch (error) {
    console.error('[v0] Error fetching user beneficiary requests:', error)
    return null
  }
}

export async function getAllBeneficiaryRequests(
  adminRole: AdminRole,
  filters?: {
    status?: string
    emergencyLevel?: string
    dateRange?: { start: Date; end: Date }
  }
): Promise<BeneficiarySupportRequest[]> {
  try {
    let q: Query<DocumentData> = query(collection(db, 'beneficiaryRequests'))

    // Filter by visible roles
    if (adminRole !== 'founder_admin') {
      q = query(q, where('visibleTo', 'array-contains', adminRole))
    }

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status))
    }

    if (filters?.emergencyLevel) {
      q = query(q, where('emergencyLevel', '==', filters.emergencyLevel))
    }

    q = query(q, orderBy('submissionDate', 'desc'))

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data() as BeneficiarySupportRequest)
  } catch (error) {
    console.error('[v0] Error fetching beneficiary requests:', error)
    return []
  }
}

export function subscribeToBeneficiaryRequests(
  adminRole: AdminRole,
  callback: (requests: BeneficiarySupportRequest[]) => void,
  filters?: {
    status?: string
    emergencyLevel?: string
  }
): Unsubscribe {
  try {
    let q: Query<DocumentData> = query(collection(db, 'beneficiaryRequests'))

    if (adminRole !== 'founder_admin') {
      q = query(q, where('visibleTo', 'array-contains', adminRole))
    }

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status))
    }

    if (filters?.emergencyLevel) {
      q = query(q, where('emergencyLevel', '==', filters.emergencyLevel))
    }

    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((doc) => doc.data() as BeneficiarySupportRequest)
      callback(requests)
    })
  } catch (error) {
    console.error('[v0] Error subscribing to beneficiary requests:', error)
    return () => {}
  }
}

// ============================================================================
// REVIEW & APPROVAL
// ============================================================================

export async function approveBeneficiaryRequest(
  requestId: string,
  adminId: string,
  approvalNotes: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'beneficiaryRequests', requestId), {
      status: 'approved',
      reviewedBy: adminId,
      reviewDate: Timestamp.now(),
      approvalNotes,
      updatedAt: Timestamp.now(),
    })

    await logBeneficiaryAccess(requestId, 'approved', 'request_approved', {
      description: `Approved by ${adminId}`,
      notes: approvalNotes,
    })
  } catch (error) {
    console.error('[v0] Error approving beneficiary request:', error)
    throw error
  }
}

export async function rejectBeneficiaryRequest(
  requestId: string,
  adminId: string,
  rejectionReason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'beneficiaryRequests', requestId), {
      status: 'rejected',
      reviewedBy: adminId,
      reviewDate: Timestamp.now(),
      reviewNotes: rejectionReason,
      updatedAt: Timestamp.now(),
    })

    await logBeneficiaryAccess(requestId, 'rejected', 'request_rejected', {
      description: `Rejected by ${adminId}`,
      reason: rejectionReason,
    })
  } catch (error) {
    console.error('[v0] Error rejecting beneficiary request:', error)
    throw error
  }
}

// ============================================================================
// SENSITIVE DOCUMENT OPERATIONS
// ============================================================================

export async function createSensitiveDocumentMetadata(
  beneficiaryRequestId: string,
  documentType: SensitiveDocumentMetadata['documentType'],
  fileName: string,
  fileSize: number,
  fileContent: Buffer
): Promise<string> {
  try {
    // Generate SHA-256 hash for file integrity
    const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex')

    const documentId = doc(collection(db, 'beneficiarySensitiveDocuments')).id

    await setDoc(doc(db, 'beneficiarySensitiveDocuments', documentId), {
      id: documentId,
      beneficiaryRequestId,
      documentType,
      fileName,
      fileSize,
      fileHash,
      uploadedAt: Timestamp.now(),
      encryptedStoragePath: `beneficiaries/${beneficiaryRequestId}/${documentId}`,
      isEncrypted: true,
      accessLog: [],
    })

    return documentId
  } catch (error) {
    console.error('[v0] Error creating document metadata:', error)
    throw error
  }
}

export async function getSensitiveDocumentMetadata(
  documentId: string
): Promise<SensitiveDocumentMetadata | null> {
  try {
    const docSnap = await getDoc(doc(db, 'beneficiarySensitiveDocuments', documentId))
    if (!docSnap.exists()) return null
    return docSnap.data() as SensitiveDocumentMetadata
  } catch (error) {
    console.error('[v0] Error fetching document metadata:', error)
    return null
  }
}

export async function logDocumentAccess(
  documentId: string,
  userId: string,
  adminRole: AdminRole,
  action: 'viewed' | 'downloaded'
): Promise<void> {
  try {
    const docRef = doc(db, 'beneficiarySensitiveDocuments', documentId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const currentAccessLog = docSnap.data().accessLog || []
      currentAccessLog.push({
        userId,
        adminRole,
        timestamp: Timestamp.now(),
        action,
      })

      await updateDoc(docRef, {
        accessLog: currentAccessLog,
      })
    }
  } catch (error) {
    console.error('[v0] Error logging document access:', error)
  }
}

// ============================================================================
// ACCESS LOGGING & AUDIT TRAIL
// ============================================================================

export async function logBeneficiaryAccess(
  beneficiaryRequestId: string,
  userId: string,
  action: BeneficiaryAccessLog['action'],
  metadata?: {
    documentType?: string
    description?: string
    notes?: string
    reason?: string
  }
): Promise<void> {
  try {
    const logId = doc(collection(db, 'beneficiaryAccessLogs')).id

    await setDoc(doc(db, 'beneficiaryAccessLogs', logId), {
      id: logId,
      beneficiaryRequestId,
      userId: userId || 'system',
      userEmail: 'system@passiveblessings.ae', // Will be updated by middleware
      action,
      timestamp: Timestamp.now(),
      ipAddress: '0.0.0.0', // Will be updated by API
      userAgent: 'web',
      details: metadata?.description || '',
      documentType: metadata?.documentType,
      ...metadata,
    })
  } catch (error) {
    console.error('[v0] Error logging beneficiary access:', error)
  }
}

export async function getBeneficiaryAccessLogs(
  beneficiaryRequestId: string
): Promise<BeneficiaryAccessLog[]> {
  try {
    const q = query(
      collection(db, 'beneficiaryAccessLogs'),
      where('beneficiaryRequestId', '==', beneficiaryRequestId),
      orderBy('timestamp', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data() as BeneficiaryAccessLog)
  } catch (error) {
    console.error('[v0] Error fetching access logs:', error)
    return []
  }
}

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

export async function getBeneficiaryConsent(
  consentId: string
): Promise<BeneficiaryConsent | null> {
  try {
    const docSnap = await getDoc(doc(db, 'beneficiaryConsents', consentId))
    if (!docSnap.exists()) return null
    return docSnap.data() as BeneficiaryConsent
  } catch (error) {
    console.error('[v0] Error fetching consent:', error)
    return null
  }
}

export async function updateBeneficiaryConsent(
  consentId: string,
  updates: Partial<BeneficiaryConsent>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'beneficiaryConsents', consentId), updates)
  } catch (error) {
    console.error('[v0] Error updating consent:', error)
    throw error
  }
}
