import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import {
  evaluateCertificateMilestonesForUser,
  getMemberVolunteerHours,
} from '@/lib/certificate-milestones-server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    const usersSnap = await db.collection('users').get()
    let issuedCount = 0
    const details: Array<{ userId: string; issued: string[] }> = []

    for (const userDoc of usersSnap.docs) {
      const result = await evaluateCertificateMilestonesForUser(userDoc.id)
      if (result.issued.length > 0) {
        issuedCount += result.issued.length
        details.push({ userId: userDoc.id, issued: result.issued })
      }
    }

    return NextResponse.json({
      success: true,
      data: { membersChecked: usersSnap.size, certificatesIssued: issuedCount, details },
    })
  } catch (error) {
    console.error('[certificates/evaluate-all]', error)
    return NextResponse.json({ success: false, error: 'Failed to evaluate all members' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }

    const hours = await getMemberVolunteerHours(userId)
    return NextResponse.json({ success: true, data: { userId, hours } })
  } catch (error) {
    console.error('[certificates/evaluate-all GET]', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
