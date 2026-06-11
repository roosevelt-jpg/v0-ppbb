import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { User, UserRole, AdminUser, AdminRole, AdminPermission } from '@/lib/types'

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

export async function requireSponsor(): Promise<User | null> {
  return requireRole('sponsor')
}

// Require specific admin role
export async function requireAdminRole(role: AdminRole): Promise<AdminUser | null> {
  const user = await requireAuth()
  if (!user || user.role !== 'admin') return null

  const { getAdminUser } = await import('@/lib/admin-access')
  const adminUser = await getAdminUser(user.id)
  if (!adminUser || adminUser.adminRole !== role) return null

  return adminUser
}

// Require specific permission
export async function requirePermission(permission: AdminPermission): Promise<AdminUser | null> {
  const user = await requireAuth()
  if (!user || user.role !== 'admin') return null

  const { hasPermission, getAdminUser } = await import('@/lib/admin-access')
  const canAccess = await hasPermission(user.id, permission)
  if (!canAccess) return null

  return getAdminUser(user.id)
}

// Verify access to resource by permission
export async function verifyResourceAccess(userId: string, permission: AdminPermission): Promise<boolean> {
  try {
    const { hasPermission } = await import('@/lib/admin-access')
    const hasAccess = await hasPermission(userId, permission)
    return hasAccess
  } catch (error) {
    console.error('[v0] Error verifying resource access:', error)
    return false
  }
}
