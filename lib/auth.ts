import { auth, db } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { User, UserRole, LocationData, UploadedImage, AdminRole } from '@/lib/types'
import { setAdminUser } from '@/lib/admin-access'

interface RegisterUserOptions {
  dateOfBirth?: string
  gender?: string
  nationality?: string
  emiratesId?: string
  location?: LocationData
  profession?: string
  employer?: string
  avatar?: UploadedImage
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = 'member',
  options?: RegisterUserOptions
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Set persistence to local
    await setPersistence(auth, browserLocalPersistence)

    // Create Firebase auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Create user profile in Firestore
    const userProfile: User = {
      id: firebaseUser.uid,
      email,
      firstName,
      lastName,
      dateOfBirth: options?.dateOfBirth,
      gender: options?.gender,
      nationality: options?.nationality,
      emiratesId: options?.emiratesId,
      avatar: options?.avatar,
      role,
      location: options?.location,
      profession: options?.profession,
      employer: options?.employer,
      volunteeredHours: 0,
      totalDonated: 0,
      membershipTier: 'standard',
      memberSince: new Date(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), userProfile)

    return { user: userProfile, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Set persistence to local
    await setPersistence(auth, browserLocalPersistence)

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Fetch user profile from Firestore
    const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid))

    if (!userDocSnap.exists()) {
      return { user: null, error: 'User profile not found' }
    }

    return { user: userDocSnap.data() as User, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('[v0] Error logging out:', error)
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        resolve(null)
        unsubscribe()
        return
      }

      try {
        const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDocSnap.exists()) {
          resolve(userDocSnap.data() as User)
        } else {
          resolve(null)
        }
      } catch (error) {
        console.error('[v0] Error fetching current user:', error)
        resolve(null)
      }

      unsubscribe()
    })
  })
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null)
      return
    }

    try {
      const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (userDocSnap.exists()) {
        callback(userDocSnap.data() as User)
      } else {
        callback(null)
      }
    } catch (error) {
      console.error('[v0] Error in auth state change:', error)
      callback(null)
    }
  })
}

// Promote user to admin role
export async function promoteUserToAdmin(
  userId: string,
  adminRole: AdminRole
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user role in Firestore
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, { role: 'admin' }, { merge: true })

    // Set admin role and permissions
    const result = await setAdminUser(userId, adminRole)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
