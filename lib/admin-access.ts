import { db } from '@/lib/firebase'
import { AdminRole, AdminPermission } from '@/lib/types'
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, Timestamp } from 'firebase/firestore'

// Admin role to permissions mapping
const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  founder_admin: [
    'view_dashboard', 'manage_users', 'manage_members', 'manage_volunteers',
    'manage_events', 'manage_donations', 'manage_charities', 'manage_businesses',
    'approve_events', 'approve_partnerships', 'approve_charities', 'approve_donations',
    'view_analytics', 'manage_content', 'moderate_community', 'manage_finance',
    'view_reports', 'manage_settings', 'manage_integrations',
  ],
  manager: [
    'view_dashboard', 'manage_members', 'manage_volunteers', 'manage_events',
    'manage_donations', 'approve_events', 'approve_partnerships', 'view_analytics', 'view_reports',
  ],
  moderator: ['view_dashboard', 'moderate_community', 'manage_content', 'view_reports'],
  analyst: ['view_dashboard', 'view_analytics', 'view_reports'],
}

// Utility maps for UI display
export const ADMIN_ROLE_NAMES: Record<AdminRole, string> = {
  founder_admin: 'Founder Admin',
  manager: 'Manager',
  moderator: 'Moderator',
  analyst: 'Analyst',
}

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  founder_admin: 'Full access to all admin functions and settings',
  manager: 'Can manage members, events, and approvals',
  moderator: 'Can moderate community content and reports',
  analyst: 'Can view analytics and generate reports',
}

// Check if user has specific permission
export async function hasPermission(userId: string, permission: AdminPermission): Promise<boolean> {
  try {
    const adminRef = doc(db, 'adminUsers', userId)
    const adminSnap = await getDoc(adminRef)
    
    if (!adminSnap.exists()) return false
    const adminData = adminSnap.data()
    return adminData?.permissions?.includes(permission) || false
  } catch (error) {
    console.error('[v0] Error checking permission:', error)
    return false
  }
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const adminRef = doc(db, 'adminUsers', userId)
    const adminSnap = await getDoc(adminRef)
    return adminSnap.exists()
  } catch (error) {
    console.error('[v0] Error checking admin status:', error)
    return false
  }
}

// Get admin user data
export async function getAdminUser(userId: string) {
  try {
    const adminRef = doc(db, 'adminUsers', userId)
    const adminSnap = await getDoc(adminRef)
    return adminSnap.exists() ? adminSnap.data() : null
  } catch (error) {
    console.error('[v0] Error getting admin user:', error)
    return null
  }
}

// Create or update admin user
export async function setAdminUser(
  userId: string,
  adminRole: AdminRole,
  invitePermissions?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { defaultPermissionsForInviteRole } = await import('@/lib/admin-invite-permissions')
    const permissions =
      Array.isArray(invitePermissions) && invitePermissions.length > 0
        ? invitePermissions
        : defaultPermissionsForInviteRole(adminRole)

    const adminRef = doc(db, 'adminUsers', userId)

    await setDoc(
      adminRef,
      {
        adminRole,
        role: adminRole,
        permissions,
        canApprove: true,
        canDelete: adminRole !== 'analyst',
        canViewAnalytics:
          permissions.includes('full_access') ||
          permissions.includes('view_reports') ||
          adminRole === 'analyst' ||
          adminRole === 'founder_admin',
        canManageUsers:
          permissions.includes('full_access') ||
          permissions.includes('manage_members') ||
          adminRole === 'founder_admin' ||
          adminRole === 'manager',
        canManageContent:
          permissions.includes('full_access') ||
          permissions.includes('manage_content') ||
          adminRole === 'founder_admin' ||
          adminRole === 'moderator',
        canManageFinance:
          permissions.includes('full_access') || adminRole === 'founder_admin',
        adminSince: Timestamp.now(),
      },
      { merge: true }
    )

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update admin user
export async function updateAdminUser(userId: string, updates: any): Promise<{ success: boolean; error?: string }> {
  try {
    const adminRef = doc(db, 'adminUsers', userId)
    await updateDoc(adminRef, { ...updates, updatedAt: Timestamp.now() })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// List all admin users
export async function listAdminUsers() {
  try {
    const adminSnapshot = await getDocs(collection(db, 'adminUsers'))
    return adminSnapshot.docs.map(doc => doc.data())
  } catch (error) {
    console.error('[v0] Error listing admin users:', error)
    return []
  }
}

// Check if one admin can manage another
export function canManageAdmin(managerRole: AdminRole, targetRole: AdminRole): boolean {
  const hierarchy: Record<AdminRole, AdminRole[]> = {
    founder_admin: ['founder_admin', 'manager', 'moderator', 'analyst'],
    manager: ['moderator', 'analyst'],
    moderator: [],
    analyst: [],
  }
  return hierarchy[managerRole]?.includes(targetRole) || false
}

// Verify admin access to resource
export async function verifyAdminAccess(userId: string, permission: AdminPermission): Promise<boolean> {
  try {
    return await hasPermission(userId, permission)
  } catch (error) {
    console.error('[v0] Error verifying admin access:', error)
    return false
  }
}
