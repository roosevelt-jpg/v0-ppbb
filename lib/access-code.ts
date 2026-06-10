import { db } from '@/lib/firebase'
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore'

/**
 * Verify admin access code
 * Returns admin user data if valid
 */
export async function verifyAccessCode(accessCode: string) {
  try {
    if (!accessCode || accessCode.trim().length === 0) {
      return { valid: false, error: 'Access code is required' }
    }

    // Query admin users with matching access code
    const adminsRef = collection(db, 'users')
    const q = query(
      adminsRef,
      where('role', '==', 'admin'),
      where('accessCode', '==', accessCode.trim().toUpperCase())
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { valid: false, error: 'Invalid access code' }
    }

    const adminData = querySnapshot.docs[0].data()

    return {
      valid: true,
      adminId: querySnapshot.docs[0].id,
      adminEmail: adminData.email,
      adminName: `${adminData.firstName} ${adminData.lastName}`,
    }
  } catch (error: any) {
    console.error('[v0] Access code verification error:', error)
    return { valid: false, error: 'Error verifying access code. Please try again.' }
  }
}

/**
 * Create or update admin access code in Firestore
 */
export async function setAdminAccessCode(userId: string, accessCode: string) {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error('User not found')
    }

    if (userDoc.data().role !== 'admin') {
      throw new Error('Only admin users can have access codes')
    }

    // Update just the access code field
    const updateData: any = {
      accessCode: accessCode.trim().toUpperCase(),
      updatedAt: new Date(),
    }

    // Use a simple update to add the accessCode field
    const userUpdateRef = doc(db, 'users', userId)
    // We'll use setDoc with merge to add/update just this field
    const { setDoc } = await import('firebase/firestore')
    await setDoc(userUpdateRef, updateData, { merge: true })

    return { success: true }
  } catch (error: any) {
    console.error('[v0] Error setting access code:', error)
    return { success: false, error: error.message }
  }
}
