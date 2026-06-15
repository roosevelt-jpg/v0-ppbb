import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore'
import { sendAccessCodeEmail } from './email-service'

export interface AdminAccessCode {
  id: string
  email: string
  code: string
  expiresAt: Date
  createdAt: Date
  usedAt?: Date
  used: boolean
  createdBy: string // Super admin who created this code
  role: 'admin' | 'super_admin'
  permissions?: string[]
}

/**
 * Generate a random 8-character access code (alphanumeric)
 */
export const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Create a new admin access code and send it via email
 */
export const createAdminAccessCode = async (
  email: string,
  role: 'admin' | 'super_admin',
  createdByUid: string,
  permissions?: string[]
): Promise<AdminAccessCode> => {
  const code = generateAccessCode()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
  const createdAt = new Date()

  try {
    // Create the access code document
    const docRef = await addDoc(collection(db, 'adminAccessCodes'), {
      email,
      code,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.fromDate(createdAt),
      used: false,
      createdBy: createdByUid,
      role,
      permissions: permissions || []
    })

    console.log('[v0] Access code created:', code)

    // Send email with access code
    await sendAccessCodeEmail(email, code, expiresAt)

    return {
      id: docRef.id,
      email,
      code,
      expiresAt,
      createdAt,
      used: false,
      createdBy: createdByUid,
      role,
      permissions
    }
  } catch (error) {
    console.error('[v0] Error creating access code:', error)
    throw error
  }
}

/**
 * Verify an access code
 */
export const verifyAdminAccessCode = async (code: string): Promise<{
  valid: boolean
  error?: string
  email?: string
  role?: 'admin' | 'super_admin'
  permissions?: string[]
}> => {
  try {
    const q = query(
      collection(db, 'adminAccessCodes'),
      where('code', '==', code.toUpperCase()),
      where('used', '==', false)
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return {
        valid: false,
        error: 'Invalid or already used access code'
      }
    }

    const doc = snapshot.docs[0]
    const data = doc.data() as any

    // Check if code is expired
    const expiresAt = data.expiresAt.toDate()
    if (new Date() > expiresAt) {
      return {
        valid: false,
        error: 'Access code has expired'
      }
    }

    return {
      valid: true,
      email: data.email,
      role: data.role,
      permissions: data.permissions || []
    }
  } catch (error) {
    console.error('[v0] Error verifying access code:', error)
    return {
      valid: false,
      error: 'Error verifying access code'
    }
  }
}

/**
 * Mark access code as used
 */
export const markAccessCodeAsUsed = async (code: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'adminAccessCodes'),
      where('code', '==', code.toUpperCase())
    )

    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      const docRef = doc(db, 'adminAccessCodes', snapshot.docs[0].id)
      await updateDoc(docRef, {
        used: true,
        usedAt: Timestamp.now()
      })
      console.log('[v0] Access code marked as used:', code)
    }
  } catch (error) {
    console.error('[v0] Error marking access code as used:', error)
  }
}

/**
 * Delete an access code (only by super admin)
 */
export const deleteAccessCode = async (codeId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'adminAccessCodes', codeId))
    console.log('[v0] Access code deleted')
  } catch (error) {
    console.error('[v0] Error deleting access code:', error)
    throw error
  }
}

/**
 * Get all access codes for super admin dashboard
 */
export const getAllAccessCodes = async (): Promise<AdminAccessCode[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'adminAccessCodes'))
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      expiresAt: doc.data().expiresAt.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      usedAt: doc.data().usedAt ? doc.data().usedAt.toDate() : undefined
    })) as AdminAccessCode[]
  } catch (error) {
    console.error('[v0] Error getting access codes:', error)
    return []
  }
}
