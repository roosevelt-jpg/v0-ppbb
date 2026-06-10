import { db } from '@/lib/firebase'
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore'

export interface ActivityLog {
  id?: string
  userId: string
  userEmail: string
  action: string
  actionType: 'SIGNUP_START' | 'SIGNUP_STEP' | 'SIGNUP_COMPLETE' | 'SIGNIN' | 'SIGNIN_FAILED' | 'PROFILE_EDIT' | 'PROFILE_VIEW' | 'LOGIN_PAGE_VISIT' | 'SIGNUP_PAGE_VISIT' | 'POLICY_VIEW' | 'CONSENT_ACCEPTED' | 'OTHER'
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Timestamp
  createdAt: Timestamp
}

export async function logActivity(userId: string, userEmail: string, actionType: ActivityLog['actionType'], action: string, details: Record<string, any> = {}) {
  try {
    const activityLog: Omit<ActivityLog, 'id'> = {
      userId,
      userEmail,
      action,
      actionType,
      details,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }

    // Try to get IP from headers if available
    try {
      const response = await fetch('/api/get-ip')
      const data = await response.json()
      if (data.ip) activityLog.ipAddress = data.ip
    } catch (err) {
      console.error('[v0] Could not fetch IP address:', err)
    }

    const docRef = await addDoc(collection(db, 'activityLogs'), activityLog)
    console.log('[v0] Activity logged:', actionType, '- Doc ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('[v0] Error logging activity:', error)
  }
}

export async function getActivityLogs(userId: string, limit: number = 100) {
  try {
    const q = query(collection(db, 'activityLogs'), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    const logs: ActivityLog[] = []
    querySnapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data() as Omit<ActivityLog, 'id'>,
      })
    })
    return logs.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()).slice(0, limit)
  } catch (error) {
    console.error('[v0] Error fetching activity logs:', error)
    return []
  }
}

export async function getUserActivityStats(userId: string) {
  try {
    const q = query(collection(db, 'activityLogs'), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    
    const stats = {
      totalActions: querySnapshot.size,
      signups: 0,
      signins: 0,
      profileEdits: 0,
      lastAction: null as Date | null,
    }

    querySnapshot.forEach(doc => {
      const data = doc.data() as Omit<ActivityLog, 'id'>
      if (data.actionType === 'SIGNUP_COMPLETE') stats.signups++
      if (data.actionType === 'SIGNIN') stats.signins++
      if (data.actionType === 'PROFILE_EDIT') stats.profileEdits++
      if (!stats.lastAction || data.timestamp > Timestamp.fromDate(stats.lastAction)) {
        stats.lastAction = data.timestamp.toDate()
      }
    })

    return stats
  } catch (error) {
    console.error('[v0] Error fetching activity stats:', error)
    return null
  }
}
