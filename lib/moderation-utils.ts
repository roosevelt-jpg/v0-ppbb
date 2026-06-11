import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore'

export interface ModerationReport {
  id: string
  reportedBy: string
  reportedUserId?: string
  reportedContentId?: string
  reason: string
  description: string
  type: 'user' | 'content' | 'post' | 'comment'
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  resolvedAt?: Date
  resolvedBy?: string
}

export interface FlaggedContent {
  id: string
  text: string
  authorId: string
  authorName: string
  groupId: string
  flagged: boolean
  flagCount: number
  flagReasons: string[]
  createdAt: Date
}

export interface FlaggedUser {
  id: string
  firstName: string
  lastName: string
  email: string
  flags: number
  warnings: number
  banned: boolean
  bannedAt?: Date
  bannedReason?: string
}

/**
 * Get all moderation reports with optional filtering
 */
export async function getModerationReports(status?: string): Promise<ModerationReport[]> {
  try {
    const q = status
      ? query(collection(db, 'communityReports'), where('status', '==', status))
      : collection(db, 'communityReports')

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ModerationReport[]
  } catch (error) {
    console.error('[v0] Error fetching reports:', error)
    throw error
  }
}

/**
 * Create a new moderation report
 */
export async function createModerationReport(
  report: Omit<ModerationReport, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const reportRef = collection(db, 'communityReports')
    const newReport = {
      ...report,
      createdAt: new Date(),
      status: 'pending' as const
    }

    const docRef = await collection(db, 'communityReports').add(newReport)
    return docRef.id
  } catch (error) {
    console.error('[v0] Error creating report:', error)
    throw error
  }
}

/**
 * Resolve a moderation report
 */
export async function resolveModerationReport(
  reportId: string,
  status: 'approved' | 'rejected',
  resolvedBy: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'communityReports', reportId), {
      status,
      resolvedAt: new Date(),
      resolvedBy
    })
  } catch (error) {
    console.error('[v0] Error resolving report:', error)
    throw error
  }
}

/**
 * Bulk resolve reports
 */
export async function bulkResolveReports(
  reportIds: string[],
  status: 'approved' | 'rejected'
): Promise<{ success: number; failed: number }> {
  try {
    const batch = writeBatch(db)
    let successful = 0

    reportIds.forEach((reportId) => {
      const reportRef = doc(db, 'communityReports', reportId)
      batch.update(reportRef, {
        status,
        resolvedAt: new Date(),
        resolvedBy: 'admin_bulk'
      })
      successful++
    })

    await batch.commit()
    return { success: successful, failed: 0 }
  } catch (error) {
    console.error('[v0] Error bulk resolving reports:', error)
    throw error
  }
}

/**
 * Flag a piece of content
 */
export async function flagContent(
  contentId: string,
  reason: string,
  reportedBy: string
): Promise<void> {
  try {
    const contentRef = doc(db, 'posts', contentId)
    const snapshot = await getDocs(query(collection(db, 'posts'), where('id', '==', contentId)))

    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      const currentFlags = doc.data().flags || []

      await updateDoc(contentRef, {
        flagged: true,
        flagCount: (doc.data().flagCount || 0) + 1,
        flagReasons: [...currentFlags, reason]
      })
    }

    // Create associated report
    await createModerationReport({
      reportedBy,
      reportedContentId: contentId,
      reason: 'Content Flagged',
      description: reason,
      type: 'content',
      status: 'pending'
    })
  } catch (error) {
    console.error('[v0] Error flagging content:', error)
    throw error
  }
}

/**
 * Flag a user
 */
export async function flagUser(
  userId: string,
  reason: string,
  reportedBy: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)))

    if (!userDoc.empty) {
      const user = userDoc.docs[0]
      await updateDoc(userRef, {
        flags: (user.data().flags || 0) + 1,
        lastFlaggedAt: new Date()
      })
    }

    // Create associated report
    await createModerationReport({
      reportedBy,
      reportedUserId: userId,
      reason: 'User Flagged',
      description: reason,
      type: 'user',
      status: 'pending'
    })
  } catch (error) {
    console.error('[v0] Error flagging user:', error)
    throw error
  }
}

/**
 * Ban a user
 */
export async function banUser(
  userId: string,
  reason: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      active: false,
      banned: true,
      bannedAt: new Date(),
      bannedReason: reason
    })
  } catch (error) {
    console.error('[v0] Error banning user:', error)
    throw error
  }
}

/**
 * Unban a user
 */
export async function unbanUser(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      active: true,
      banned: false,
      bannedAt: null,
      bannedReason: null
    })
  } catch (error) {
    console.error('[v0] Error unbanning user:', error)
    throw error
  }
}

/**
 * Delete flagged content
 */
export async function deleteContent(
  contentId: string,
  reason: string
): Promise<void> {
  try {
    const contentRef = doc(db, 'posts', contentId)
    await updateDoc(contentRef, {
      deleted: true,
      deletedAt: new Date(),
      deletedReason: reason
    })
  } catch (error) {
    console.error('[v0] Error deleting content:', error)
    throw error
  }
}

/**
 * Get moderation statistics
 */
export async function getModerationStats(): Promise<{
  totalReports: number
  pendingReports: number
  approvedReports: number
  rejectedReports: number
  flaggedUsers: number
  flaggedContent: number
  bannedUsers: number
}> {
  try {
    const reportsSnap = await getDocs(collection(db, 'communityReports'))
    const usersSnap = await getDocs(query(collection(db, 'users'), where('flags', '>', 0)))
    const contentSnap = await getDocs(query(collection(db, 'posts'), where('flagged', '==', true)))
    const bannedSnap = await getDocs(query(collection(db, 'users'), where('banned', '==', true)))

    const reports = reportsSnap.docs.map(d => d.data())

    return {
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      approvedReports: reports.filter(r => r.status === 'approved').length,
      rejectedReports: reports.filter(r => r.status === 'rejected').length,
      flaggedUsers: usersSnap.size,
      flaggedContent: contentSnap.size,
      bannedUsers: bannedSnap.size
    }
  } catch (error) {
    console.error('[v0] Error getting moderation stats:', error)
    throw error
  }
}

/**
 * Warn a user (increment warning count)
 */
export async function warnUser(
  userId: string,
  reason: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)))

    if (!userDoc.empty) {
      const user = userDoc.docs[0]
      const warnings = (user.data().warnings || 0) + 1

      await updateDoc(userRef, {
        warnings,
        lastWarningAt: new Date(),
        lastWarningReason: reason
      })

      // Auto-ban if 3+ warnings
      if (warnings >= 3) {
        await banUser(userId, `Auto-banned after ${warnings} warnings`)
      }
    }
  } catch (error) {
    console.error('[v0] Error warning user:', error)
    throw error
  }
}

/**
 * Get recent moderation activity
 */
export async function getRecentActivity(limit = 20): Promise<any[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'communityReports'),
        orderBy: 'createdAt',
        limit
      )
    )
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('[v0] Error getting activity:', error)
    throw error
  }
}
