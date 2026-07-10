import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getAdminDb } from '@/lib/firebase-admin'
import { hasBusinessAccessServer, hasAdminAccessServer } from '@/lib/roles-server'

export async function verifyAuthUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyIdToken(token)
}

export async function getAuthAudience(
  request: NextRequest
): Promise<'member' | 'business' | null> {
  const uid = await verifyAuthUid(request)
  if (!uid) return null

  const userDoc = await getAdminDb().collection('users').doc(uid).get()
  const user = userDoc.data() || { role: 'member' }

  if (hasBusinessAccessServer(user) && !hasAdminAccessServer(user)) {
    return 'business'
  }
  return 'member'
}

export function authRequiredResponse() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}
