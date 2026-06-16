import { AdminLoginLog, AdminAccessCode } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore'

/**
 * Parse user agent to extract device info
 */
export function parseUserAgent(userAgent: string) {
  const browserMatch = userAgent.match(/(Chrome|Safari|Firefox|Edge|Opera)\/[\d.]+/)
  const osMatch = userAgent.match(/(Windows|Mac|Linux|iOS|Android)/)
  
  return {
    browser: browserMatch ? browserMatch[1] : 'Unknown',
    os: osMatch ? osMatch[1] : 'Unknown',
    osVersion: userAgent.match(/OS [\d_.]+|Windows NT [\d.]+|Android [\d.]+/) ? 
      userAgent.match(/OS [\d_.]+|Windows NT [\d.]+|Android [\d.]+/)?.[0] || 'Unknown' : 
      'Unknown',
    deviceType: /Mobile|Android|iPhone|iPad|Tablet/.test(userAgent) ? 
      /Tablet|iPad/.test(userAgent) ? 'tablet' : 'mobile' : 'desktop',
  }
}

/**
 * Get geolocation from IP address using ipapi (free tier available)
 */
export async function getLocationFromIP(ipAddress: string) {
  try {
    // Use ipapi.co (free, no API key required)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 5000,
    })
    
    if (!response.ok) {
      console.warn('[v0] Geolocation API error:', response.status)
      return null
    }

    const data = await response.json()
    
    return {
      city: data.city || undefined,
      state: data.region || undefined,
      country: data.country_name || undefined,
      countryCode: data.country_code || undefined,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      timezone: data.timezone || undefined,
    }
  } catch (error) {
    console.warn('[v0] Error fetching geolocation:', error)
    return null
  }
}

/**
 * Create login attempt log
 */
export async function logAdminLogin(
  adminId: string,
  adminEmail: string,
  adminName: string,
  ipAddress: string,
  userAgent: string,
  status: 'success' | 'failed' | 'locked',
  accessCodeId?: string,
  failureReason?: string
): Promise<AdminLoginLog | null> {
  try {
    const deviceInfo = parseUserAgent(userAgent)
    const location = await getLocationFromIP(ipAddress)
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const loginLog: Omit<AdminLoginLog, 'id'> = {
      adminId,
      adminEmail,
      adminName,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      deviceInfo,
      location: location || undefined,
      status,
      failureReason: failureReason || undefined,
      accessCodeId: accessCodeId || undefined,
      sessionId,
    }

    const docRef = await addDoc(collection(db, 'adminLoginLogs'), {
      ...loginLog,
      timestamp: Timestamp.fromDate(new Date()),
    })

    return {
      ...loginLog,
      id: docRef.id,
    }
  } catch (error) {
    console.error('[v0] Error logging admin login:', error)
    return null
  }
}

/**
 * Get login history for admin
 */
export async function getAdminLoginHistory(
  adminId: string,
  limitCount: number = 20
): Promise<AdminLoginLog[]> {
  try {
    const q = query(
      collection(db, 'adminLoginLogs'),
      where('adminId', '==', adminId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    } as AdminLoginLog))
  } catch (error) {
    console.error('[v0] Error fetching login history:', error)
    return []
  }
}

/**
 * Get all admin login history (super admin only)
 */
export async function getAllAdminLoginHistory(
  limitCount: number = 100
): Promise<AdminLoginLog[]> {
  try {
    const q = query(
      collection(db, 'adminLoginLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    } as AdminLoginLog))
  } catch (error) {
    console.error('[v0] Error fetching all login history:', error)
    return []
  }
}

/**
 * Create dynamic access code for admin login
 */
export async function generateDynamicAccessCode(
  adminEmail: string,
  adminName: string,
  adminRole: 'super_admin' | 'admin' | 'moderator',
  permissions: string[],
  createdBy: string
): Promise<AdminAccessCode | null> {
  try {
    // Generate 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'PB-ADMIN-'
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24-hour expiry

    const accessCode: Omit<AdminAccessCode, 'id'> = {
      code,
      adminEmail,
      adminName,
      adminRole,
      permissions,
      createdAt: new Date(),
      expiresAt,
      isUsed: false,
      createdBy,
      status: 'active',
    }

    const docRef = await addDoc(collection(db, 'adminAccessCodes'), {
      ...accessCode,
      createdAt: Timestamp.fromDate(accessCode.createdAt),
      expiresAt: Timestamp.fromDate(expiresAt),
    })

    return {
      ...accessCode,
      id: docRef.id,
    }
  } catch (error) {
    console.error('[v0] Error generating access code:', error)
    return null
  }
}

/**
 * Verify and mark access code as used
 */
export async function verifyAccessCode(
  code: string,
  ipAddress: string,
  location?: string
): Promise<{ valid: boolean; accessCode?: AdminAccessCode; error?: string }> {
  try {
    const q = query(
      collection(db, 'adminAccessCodes'),
      where('code', '==', code),
      where('status', '==', 'active')
    )

    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return { valid: false, error: 'Invalid or expired access code' }
    }

    const doc = snapshot.docs[0]
    const accessCode = { ...doc.data(), id: doc.id } as AdminAccessCode

    // Check if code is expired
    if (accessCode.expiresAt < new Date()) {
      return { valid: false, error: 'Access code has expired' }
    }

    // Check if code was already used
    if (accessCode.isUsed) {
      return { valid: false, error: 'Access code has already been used' }
    }

    // Mark as used
    await (await import('firebase/firestore')).updateDoc(doc.ref, {
      isUsed: true,
      usedAt: Timestamp.fromDate(new Date()),
      usedIP: ipAddress,
      usedLocation: location,
      status: 'used',
    })

    return { valid: true, accessCode }
  } catch (error) {
    console.error('[v0] Error verifying access code:', error)
    return { valid: false, error: error instanceof Error ? error.message : 'Verification failed' }
  }
}
