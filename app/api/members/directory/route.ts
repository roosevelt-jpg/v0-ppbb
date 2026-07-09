import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  canShowInMemberDirectory,
  isAccountDeleted,
  toDirectoryMember,
  type PublicMemberProfile,
} from '@/lib/user-settings'

/**
 * Public member directory — only members who opted in via privacy settings.
 * GET /api/members/directory?search=&limit=
 */
export async function GET(request: NextRequest) {
  try {
    const search = (request.nextUrl.searchParams.get('search') || '').trim().toLowerCase()
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || '100', 10) || 100,
      500
    )

    const db = getAdminDb()
    const snapshot = await db.collection('users').limit(Math.max(limit * 3, 100)).get()

    const members: PublicMemberProfile[] = []
    for (const doc of snapshot.docs) {
      const data = doc.data()
      if (isAccountDeleted({ ...data, id: doc.id })) continue
      if (!canShowInMemberDirectory({ ...data, id: doc.id })) continue

      const profile = toDirectoryMember(doc.id, data)
      if (!profile) continue

      if (search) {
        const haystack = [
          profile.displayName,
          profile.firstName,
          profile.lastName,
          profile.location,
          profile.bio,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(search)) continue
      }

      members.push(profile)
      if (members.length >= limit) break
    }

    members.sort((a, b) => a.displayName.localeCompare(b.displayName))

    return NextResponse.json({ success: true, data: members, count: members.length })
  } catch (error) {
    console.error('[v0] Member directory error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load directory' }, { status: 500 })
  }
}
