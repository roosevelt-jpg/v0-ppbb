import { getAdminDb } from '@/lib/firebase-admin'
import { hasAdminAccessServer } from '@/lib/roles-server'
import { memberCanChat } from '@/lib/community-governance'

/**
 * Active group member, group creator, or platform admin may use chat/forum/roster.
 */
export async function assertCanUseGroup(
  communityId: string,
  groupId: string,
  uid: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const db = getAdminDb()
  const groupSnap = await db
    .collection('communities')
    .doc(communityId)
    .collection('groups')
    .doc(groupId)
    .get()

  if (!groupSnap.exists) {
    return { ok: false, status: 404, error: 'Group not found' }
  }

  const groupData = groupSnap.data() || {}
  if (groupData.createdBy === uid) return { ok: true }

  const userSnap = await db.collection('users').doc(uid).get()
  if (hasAdminAccessServer(userSnap.data() || {})) return { ok: true }

  const membersSnap = await db
    .collection('communities')
    .doc(communityId)
    .collection('groups')
    .doc(groupId)
    .collection('members')
    .where('userId', '==', uid)
    .limit(1)
    .get()

  if (membersSnap.empty) {
    return { ok: false, status: 403, error: 'Not a group member' }
  }

  const member = membersSnap.docs[0].data()
  const status = String(member.memberStatus || 'active')
  const active =
    (member.joinStatus === 'active' || member.isActive !== false) && memberCanChat(status)

  if (!active) {
    return { ok: false, status: 403, error: 'Membership is not active' }
  }

  return { ok: true }
}
