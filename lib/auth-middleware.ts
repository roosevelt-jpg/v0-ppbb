import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { User, UserRole } from '@/lib/types'

export async function requireAuth(): Promise<User | null> {
  const user = auth.currentUser
  if (!user) return null

  const userDocSnap = await getDoc(doc(db, 'users', user.uid))
  return userDocSnap.exists() ? (userDocSnap.data() as User) : null
}

export async function requireRole(...roles: UserRole[]): Promise<User | null> {
  const user = await requireAuth()
  if (!user || !roles.includes(user.role)) return null
  return user
}

export async function requireAdmin(): Promise<User | null> {
  return requireRole('admin')
}
