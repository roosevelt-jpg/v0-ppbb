import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

/**
 * Migration endpoint to fix business users who have role: 'business' 
 * instead of role: 'member' with roles: ['member', 'business']
 * 
 * This fixes the issue where existing business users can't access /business/dashboard
 * because hasBusinessAccess() requires BOTH member and business roles.
 */
export async function POST(req: NextRequest) {
  try {
    // Get admin auth header for verification
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()

    // Query all users with role: 'business'
    const usersSnapshot = await db
      .collection('users')
      .where('role', '==', 'business')
      .get()

    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No business users found to migrate',
        count: 0,
      })
    }

    // Update each user to have role: 'member' with roles: ['member', 'business']
    const batch = db.batch()
    let updateCount = 0

    usersSnapshot.docs.forEach((doc) => {
      const userData = doc.data()
      
      // Only update if they have role: 'business' and not already in the correct state
      if (userData.role === 'business') {
        batch.update(doc.ref, {
          role: 'member',
          roles: ['member', 'business'],
          migratedAt: new Date(),
        })
        updateCount++
      }
    })

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updateCount} business users`,
      count: updateCount,
    })
  } catch (error) {
    console.error('[v0] Migration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check status of business users
 */
export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()

    // Count users with role: 'business' (old format)
    const businessSnapshot = await db
      .collection('users')
      .where('role', '==', 'business')
      .get()

    // Count users with role: 'member' AND roles array containing 'business'
    const memberSnapshot = await db
      .collection('users')
      .where('role', '==', 'member')
      .get()

    let migratedCount = 0
    memberSnapshot.docs.forEach((doc) => {
      const userData = doc.data()
      if (Array.isArray(userData.roles) && userData.roles.includes('business')) {
        migratedCount++
      }
    })

    return NextResponse.json({
      success: true,
      status: {
        needsMigration: businessSnapshot.size,
        alreadyMigrated: migratedCount,
        totalBusinessUsers: businessSnapshot.size + migratedCount,
      },
    })
  } catch (error) {
    console.error('[v0] Status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    )
  }
}
