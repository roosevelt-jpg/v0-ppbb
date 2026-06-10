import { db, auth } from '@/lib/firebase'
import { AdminUser, AdminRole, AdminPermission } from '@/lib/types'
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore'

// Admin role to permissions mapping
const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  founder_admin: [
    'view_dashboard',
    'manage_users',
    'manage_members',
    'manage_volunteers',
    'manage_events',
    'manage_donations',
    'manage_charities',
    'manage_businesses',
    'approve_events',
    'approve_partnerships',
    'approve_charities',
    'approve_donations',
    'view_analytics',
    'manage_content',
    'moderate_community',
    'manage_finance',
    'view_reports',
    'manage_settings',
    'manage_integrations',
  ],
  manager: [
    'view_dashboard',
    'manage_members',
    'manage_volunteers',
    'manage_events',
    'manage_charities',
    'approve_events',
    'approve_charities',
    'view_analytics',
    'manage_content',
    'moderate_community',
    'view_reports',
  ],
  moderator: [
    'view_dashboard',
    'moderate_community',
    'manage_content',
    'view_reports',
  ],
  analyst: [
    'view_dashboard',
    'view_analytics',
    'view_reports',
  ],
}

// Get admin user by ID
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) return null

    const userData = docSnap.data()
    if (userData.role !== 'admin') return null

    return {
      ...userData,
      id: docSnap.id,
    } as AdminUser
  } catch (error) {
    console.error('[v0] Error fetching admin user:', error)
    return null
  }
}

// Check if user has specific permission
export async function hasPermission(userId: string, permission: AdminPermission): Promise<boolean> {
  try {
    const adminUser = await getAdminUser(userId)
    if (!adminUser) return false

    return adminUser.permissions.includes(permission)
  } catch (error) {
    console.error('[v0] Error checking permission:', error)
    return false
  }
}

// Check if user has admin role
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) return false

    return docSnap.data().role === 'admin'
  } catch (error) {
    console.error('[v0] Error checking admin status:', error)
    return false
  }
}

// Verify admin access based on permission
export async function verifyAdminAccess(userId: string, permission: AdminPermission): Promise<{ hasAccess: boolean; message?: string }> {
  try {
    const adminUser = await getAdminUser(userId)

    if (!adminUser) {
      return { hasAccess: false, message: 'User is not an admin' }
    }

    if (!adminUser.permissions.includes(permission)) {
      return { hasAccess: false, message: `User does not have permission: ${permission}` }
    }

    return { hasAccess: true }
  } catch (error) {
    console.error('[v0] Error verifying admin access:', error)
    return { hasAccess: false, message: 'Error verifying access' }
  }
}

// Create or update admin user
export async function setAdminUser(
  userId: string,
  adminRole: AdminRole,
  additionalData?: Partial<AdminUser>
): Promise<{ success: boolean; error?: string }> {
  try {
    const permissions = ROLE_PERMISSIONS[adminRole]

    const adminUserData: Partial<AdminUser> = {
      ...additionalData,
      adminRole,
      permissions,
      canApprove: ['founder_admin', 'manager'].includes(adminRole),
      canDelete: ['founder_admin'].includes(adminRole),
      canViewAnalytics: ['founder_admin', 'manager', 'analyst'].includes(adminRole),
      canManageUsers: ['founder_admin', 'manager'].includes(adminRole),
      canManageContent: ['founder_admin', 'manager', 'moderator'].includes(adminRole),
      canManageFinance: ['founder_admin'].includes(adminRole),
      adminSince: additionalData?.adminSince || new Date(),
      updatedAt: new Date(),
    }

    const docRef = doc(db, 'users', userId)
    await setDoc(docRef, adminUserData, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('[v0] Error setting admin user:', error)
    return { success: false, error: String(error) }
  }
}

// Get all admins
export async function getAllAdmins(): Promise<AdminUser[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AdminUser[]
  } catch (error) {
    console.error('[v0] Error fetching admins:', error)
    return []
  }
}

// Get admins by role
export async function getAdminsByRole(adminRole: AdminRole): Promise<AdminUser[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'admin'),
      where('adminRole', '==', adminRole)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AdminUser[]
  } catch (error) {
    console.error('[v0] Error fetching admins by role:', error)
    return []
  }
}

// Remove admin role from user
export async function removeAdminRole(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'users', userId)
    await updateDoc(docRef, {
      role: 'member',
      adminRole: null,
      permissions: [],
      canApprove: false,
      canDelete: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canManageContent: false,
      canManageFinance: false,
      updatedAt: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error('[v0] Error removing admin role:', error)
    return { success: false, error: String(error) }
  }
}

// Check admin hierarchy (founder can manage all, manager can manage moderators/analysts, etc.)
export function canManageAdmin(managerRole: AdminRole, targetRole: AdminRole): boolean {
  const hierarchy: Record<AdminRole, AdminRole[]> = {
    founder_admin: ['manager', 'moderator', 'analyst'],
    manager: ['moderator', 'analyst'],
    moderator: ['analyst'],
    analyst: [],
  }

  return hierarchy[managerRole]?.includes(targetRole) || false
}

// Get role display name
export function getAdminRoleDisplayName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    founder_admin: 'Founder Admin',
    manager: 'Manager',
    moderator: 'Moderator',
    analyst: 'Analyst',
  }
  return names[role]
}

// Get role description
export function getAdminRoleDescription(role: AdminRole): string {
  const descriptions: Record<AdminRole, string> = {
    founder_admin: 'Full access to all admin functions and settings',
    manager: 'Can manage members, events, and approvals',
    moderator: 'Can moderate community content and reports',
    analyst: 'Can view analytics and generate reports',
  }
  return descriptions[role]
}
