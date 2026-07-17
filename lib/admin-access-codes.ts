import { db } from '@/lib/firebase'
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: string[]
  accessCode: string
  accessCodeExpiry?: number
  isActive: boolean
  createdAt: number
  createdBy: string
  lastLogin?: number
}

/**
 * Generate a 6-digit numeric access code
 */
export function generateAccessCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
}

/**
 * Create a new admin user with access code
 */
export async function createAdminUser(
  data: Omit<AdminUser, 'id' | 'createdAt' | 'accessCode' | 'isActive' | 'lastLogin'>,
  createdByAdminId: string
): Promise<{ success: boolean; adminId?: string; accessCode?: string; error?: string }> {
  try {
    // Generate unique access code
    const accessCode = generateAccessCode()
    const adminId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const adminDoc: AdminUser = {
      ...data,
      id: adminId,
      accessCode,
      isActive: true,
      createdAt: Date.now(),
      createdBy: createdByAdminId,
    }

    // Save to Firestore in adminUsers collection
    await setDoc(doc(db, 'adminUsers', adminId), adminDoc)

    // Also create corresponding auth user entry if email is provided
    if (data.email) {
      await setDoc(
        doc(db, 'users', adminId),
        {
          id: adminId,
          email: data.email,
          name: data.name,
          role: 'admin',
          adminRole: data.role,
          permissions: data.permissions,
          accessCode,
          isAdmin: true,
          createdAt: new Date(),
          createdBy: createdByAdminId,
        },
        { merge: true }
      )
    }

    return {
      success: true,
      adminId,
      accessCode,
    }
  } catch (error: any) {
    console.error('[v0] Error creating admin user:', error)
    return {
      success: false,
      error: error.message || 'Failed to create admin user',
    }
  }
}

/**
 * Get all admin users
 */
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  try {
    const adminsRef = collection(db, 'adminUsers')
    const querySnapshot = await getDocs(adminsRef)
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as AdminUser))
  } catch (error: any) {
    console.error('[v0] Error fetching admin users:', error)
    return []
  }
}

/**
 * Get a single admin user by ID
 */
export async function getAdminUser(adminId: string): Promise<AdminUser | null> {
  try {
    const adminRef = doc(db, 'adminUsers', adminId)
    const adminSnap = await getDoc(adminRef)
    return adminSnap.exists() ? ({ ...adminSnap.data(), id: adminId } as AdminUser) : null
  } catch (error: any) {
    console.error('[v0] Error fetching admin user:', error)
    return null
  }
}

/**
 * Update admin user
 */
export async function updateAdminUser(
  adminId: string,
  updates: Partial<Omit<AdminUser, 'id' | 'createdAt' | 'createdBy'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminRef = doc(db, 'adminUsers', adminId)
    await updateDoc(adminRef, updates as any)
    return { success: true }
  } catch (error: any) {
    console.error('[v0] Error updating admin user:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Regenerate access code for admin
 */
export async function regenerateAccessCode(adminId: string): Promise<{ success: boolean; accessCode?: string; error?: string }> {
  try {
    const newAccessCode = generateAccessCode()
    await updateAdminUser(adminId, { accessCode: newAccessCode })
    return { success: true, accessCode: newAccessCode }
  } catch (error: any) {
    console.error('[v0] Error regenerating access code:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete admin user
 */
export async function deleteAdminUser(adminId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(doc(db, 'adminUsers', adminId))
    // Also delete from users collection
    await deleteDoc(doc(db, 'users', adminId))
    return { success: true }
  } catch (error: any) {
    console.error('[v0] Error deleting admin user:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verify access code for admin login
 */
export async function verifyAdminAccessCode(accessCode: string): Promise<{ valid: boolean; admin?: AdminUser; error?: string }> {
  try {
    if (!accessCode || accessCode.trim().length === 0) {
      return { valid: false, error: 'Access code is required' }
    }

    const adminsRef = collection(db, 'adminUsers')
    const q = query(adminsRef, where('accessCode', '==', accessCode.toUpperCase()), where('isActive', '==', true))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { valid: false, error: 'Invalid access code' }
    }

    const adminData = querySnapshot.docs[0].data() as AdminUser
    return {
      valid: true,
      admin: { ...adminData, id: querySnapshot.docs[0].id },
    }
  } catch (error: any) {
    console.error('[v0] Error verifying access code:', error)
    return { valid: false, error: error.message }
  }
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(adminId: string): Promise<boolean> {
  try {
    const admin = await getAdminUser(adminId)
    return admin?.role === 'super_admin'
  } catch {
    return false
  }
}
