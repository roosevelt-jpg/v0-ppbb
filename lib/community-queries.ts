'use client'

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  arrayUnion,
  Timestamp,
  collectionGroup,
  increment,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Community, Group, Message, GroupMember, CommunityMember } from './community-types'
import { triggerCommunityNotification } from '@/lib/community-notifications-client'
import {
  canJoinByGenderRestriction,
  isCommunityVisible,
  isGroupVisible,
  memberCanChat,
  normalizeGenderRestriction,
} from './community-governance'

// COMMUNITY SUBSCRIPTIONS
export function subscribeToAllCommunities(
  onData: (communities: Community[]) => void,
  options?: { featured?: boolean; category?: string }
) {
  try {
    let q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'), limit(100))

    if (options?.featured) {
      q = query(collection(db, 'communities'), where('isFeatured', '==', true), orderBy('createdAt', 'desc'))
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const communities = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          genderRestriction: normalizeGenderRestriction(doc.data().genderRestriction),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        })) as Community[]
        onData(communities.filter((c) => isCommunityVisible(c.status)))
      },
      (error) => {
        console.error('[v0] Error in subscribeToAllCommunities:', error)
        onData([])
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('[v0] Error subscribing to communities:', error)
    return () => {}
  }
}

export function subscribeToCommunity(
  communityId: string,
  onData: (community: Community | null) => void
) {
  try {
    const unsubscribe = onSnapshot(
      doc(db, 'communities', communityId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          onData({
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          } as Community)
        } else {
          onData(null)
        }
      },
      (error) => {
        console.error('[v0] Error in subscribeToCommunity:', error)
        onData(null)
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('[v0] Error subscribing to community:', error)
    return () => {}
  }
}

export function subscribeToUserCommunities(
  userId: string,
  onData: (communities: Community[]) => void
) {
  if (!userId) {
    onData([])
    return () => {}
  }

  try {
    const unsubscribe = onSnapshot(
      query(collectionGroup(db, 'members'), where('userId', '==', userId)),
      async (snapshot) => {
        const communityIds = new Set<string>()
        for (const memberDoc of snapshot.docs) {
          const path = memberDoc.ref.path
          if (!path.includes('/communities/') || path.includes('/groups/')) continue
          const data = memberDoc.data()
          if (data.memberStatus === 'banned' || data.memberStatus === 'removed') continue
          if (data.isActive === false && data.joinStatus !== 'active') continue
          const communityId = memberDoc.ref.parent.parent?.id
          if (communityId) communityIds.add(communityId)
        }

        if (communityIds.size === 0) {
          onData([])
          return
        }

        const communities: Community[] = []
        await Promise.all(
          Array.from(communityIds).map(async (id) => {
            const snap = await getDoc(doc(db, 'communities', id))
            if (snap.exists()) {
              communities.push({
                id: snap.id,
                ...snap.data(),
                createdAt: snap.data().createdAt?.toDate?.() || snap.data().createdAt,
                updatedAt: snap.data().updatedAt?.toDate?.() || snap.data().updatedAt,
              } as Community)
            }
          })
        )
        communities.sort(
          (a, b) =>
            new Date(String(b.updatedAt || 0)).getTime() -
            new Date(String(a.updatedAt || 0)).getTime()
        )
        onData(communities)
      },
      (error) => {
        console.error('[v0] Error in subscribeToUserCommunities:', error)
        onData([])
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('[v0] Error subscribing to user communities:', error)
    return () => {}
  }
}

// GROUP SUBSCRIPTIONS
export function subscribeToCommunityGroups(
  communityId: string,
  onData: (groups: Group[]) => void
) {
  try {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'communities', communityId, 'groups'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const groups = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            communityId,
            ...doc.data(),
            genderRestriction: normalizeGenderRestriction(doc.data().genderRestriction),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
          })) as Group[]
        onData(groups.filter((g) => isGroupVisible(g.status)))
      },
      (error) => {
        console.error('[v0] Error in subscribeToCommunityGroups:', error)
        onData([])
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('[v0] Error subscribing to groups:', error)
    return () => {}
  }
}

// MESSAGE SUBSCRIPTIONS
export function subscribeToGroupMessages(
  communityId: string,
  groupId: string,
  onData: (messages: Message[]) => void
) {
  try {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'communities', communityId, 'groups', groupId, 'messages'),
        orderBy('sentAt', 'asc'),
        limit(200)
      ),
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => {
          const data = doc.data()
          const ts = data.sentAt?.toDate?.() || data.timestamp?.toDate?.() || data.sentAt || data.timestamp
          return {
            id: doc.id,
            communityId,
            groupId,
            ...data,
            content: data.content || data.text || '',
            text: data.text || data.content || '',
            timestamp: ts,
            sentAt: ts,
            editedAt: data.editedAt?.toDate?.() || data.editedAt,
          }
        }) as Message[]
        onData(messages)
      },
      (error) => {
        console.error('[v0] Error in subscribeToGroupMessages:', error)
        onData([])
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('[v0] Error subscribing to messages:', error)
    return () => {}
  }
}

// COMMUNITY MUTATIONS
export async function createCommunity(data: Partial<Community>) {
  try {
    const docRef = await addDoc(collection(db, 'communities'), {
      ...data,
      genderRestriction: normalizeGenderRestriction(data.genderRestriction),
      status: data.status || 'active',
      memberCount: data.memberCount ?? 1,
      groupCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('[v0] Error creating community:', error)
    throw error
  }
}

export async function updateCommunity(communityId: string, data: Partial<Community>) {
  try {
    await updateDoc(doc(db, 'communities', communityId), {
      ...data,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('[v0] Error updating community:', error)
    throw error
  }
}

export async function deleteCommunity(communityId: string) {
  try {
    await deleteDoc(doc(db, 'communities', communityId))
  } catch (error) {
    console.error('[v0] Error deleting community:', error)
    throw error
  }
}

// GROUP MUTATIONS
export async function createGroup(communityId: string, data: Partial<Group>) {
  try {
    const docRef = await addDoc(collection(db, 'communities', communityId, 'groups'), {
      ...data,
      genderRestriction: normalizeGenderRestriction(data.genderRestriction),
      status: data.status || 'active',
      memberCount: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    await updateDoc(doc(db, 'communities', communityId), {
      groupCount: increment(1),
      updatedAt: Timestamp.now(),
    })

    return docRef.id
  } catch (error) {
    console.error('[v0] Error creating group:', error)
    throw error
  }
}

export async function updateGroup(communityId: string, groupId: string, data: Partial<Group>) {
  try {
    await updateDoc(doc(db, 'communities', communityId, 'groups', groupId), {
      ...data,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('[v0] Error updating group:', error)
    throw error
  }
}

export async function deleteGroup(communityId: string, groupId: string) {
  try {
    await deleteDoc(doc(db, 'communities', communityId, 'groups', groupId))
  } catch (error) {
    console.error('[v0] Error deleting group:', error)
    throw error
  }
}

// MESSAGE MUTATIONS
export async function sendMessage(
  communityId: string,
  groupId: string,
  message: Partial<Message>
) {
  try {
    const docRef = await addDoc(
      collection(db, 'communities', communityId, 'groups', groupId, 'messages'),
      {
        ...message,
        timestamp: Timestamp.now(),
        edited: false,
        reactions: [],
      }
    )
    return docRef.id
  } catch (error) {
    console.error('[v0] Error sending message:', error)
    throw error
  }
}

export async function updateMessage(
  communityId: string,
  groupId: string,
  messageId: string,
  updates: Partial<Message>
) {
  try {
    await updateDoc(
      doc(db, 'communities', communityId, 'groups', groupId, 'messages', messageId),
      {
        ...updates,
        edited: true,
        editedAt: Timestamp.now(),
      }
    )
  } catch (error) {
    console.error('[v0] Error updating message:', error)
    throw error
  }
}

export async function deleteMessage(
  communityId: string,
  groupId: string,
  messageId: string
) {
  try {
    await deleteDoc(
      doc(db, 'communities', communityId, 'groups', groupId, 'messages', messageId)
    )
  } catch (error) {
    console.error('[v0] Error deleting message:', error)
    throw error
  }
}

// MEMBER OPERATIONS
export async function joinCommunity(
  communityId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userGender?: string,
  userPhoto?: string
) {
  try {
    const communityRef = doc(db, 'communities', communityId)
    const communitySnap = await getDoc(communityRef)
    if (!communitySnap.exists()) throw new Error('Community not found')

    const community = communitySnap.data()
    if (!isCommunityVisible(community.status)) {
      throw new Error('This community is not available yet (pending admin approval).')
    }

    const genderCheck = canJoinByGenderRestriction(community.genderRestriction, userGender)
    if (!genderCheck.allowed) throw new Error(genderCheck.reason || 'Gender restriction applies')

    const existing = await getDocs(
      query(collection(db, 'communities', communityId, 'members'), where('userId', '==', userId))
    )
    if (!existing.empty) {
      const row = existing.docs[0].data()
      if (row.memberStatus === 'banned') throw new Error('You are banned from this community.')
      if (row.memberStatus === 'suspended') throw new Error('Your membership is suspended.')
      return
    }

    await addDoc(collection(db, 'communities', communityId, 'members'), {
      userId,
      userName,
      userEmail,
      userGender,
      userPhoto,
      joinedAt: Timestamp.now(),
      role: 'member',
      isActive: true,
      memberStatus: 'active',
    })

    await updateDoc(communityRef, {
      memberCount: increment(1),
      updatedAt: Timestamp.now(),
    })

    void triggerCommunityNotification({
      type: 'community_joined',
      communityId,
      communityName: community.name,
    })
  } catch (error) {
    console.error('[v0] Error joining community:', error)
    throw error
  }
}

export async function leaveCommunity(communityId: string, userId: string) {
  try {
    const membersSnapshot = await getDocs(
      query(
        collection(db, 'communities', communityId, 'members'),
        where('userId', '==', userId)
      )
    )

    if (!membersSnapshot.empty) {
      const memberDoc = membersSnapshot.docs[0]
      await deleteDoc(memberDoc.ref)

      // Update member count
      const communityRef = doc(db, 'communities', communityId)
      const communityDoc = await getDocs(query(collection(db, 'communities')))
      const community = communityDoc.docs.find(d => d.id === communityId)?.data()
      if (community) {
        await updateDoc(communityRef, {
          memberCount: Math.max(0, (community.memberCount || 1) - 1),
        })
      }
    }
  } catch (error) {
    console.error('[v0] Error leaving community:', error)
    throw error
  }
}

export function subscribeToUserGroupMemberships(
  communityId: string,
  userId: string,
  onData: (memberships: Record<string, 'active' | 'pending' | 'rejected'>) => void
) {
  if (!userId) {
    onData({})
    return () => {}
  }

  const unsubscribers: Array<() => void> = []
  const statuses: Record<string, 'active' | 'pending' | 'rejected'> = {}

  const groupsUnsub = onSnapshot(collection(db, 'communities', communityId, 'groups'), (groupSnap) => {
    unsubscribers.forEach((u) => u())
    unsubscribers.length = 0
    Object.keys(statuses).forEach((k) => delete statuses[k])

    groupSnap.docs.forEach((groupDoc) => {
      const groupId = groupDoc.id
      const memberQuery = query(
        collection(db, 'communities', communityId, 'groups', groupId, 'members'),
        where('userId', '==', userId)
      )
      const unsub = onSnapshot(memberQuery, (memberSnap) => {
        if (memberSnap.empty) {
          delete statuses[groupId]
        } else {
          const data = memberSnap.docs[0].data()
          statuses[groupId] = (data.joinStatus as 'active' | 'pending' | 'rejected') || 'active'
        }
        onData({ ...statuses })
      })
      unsubscribers.push(unsub)
    })

    if (groupSnap.empty) onData({})
  })

  return () => {
    groupsUnsub()
    unsubscribers.forEach((u) => u())
  }
}

export async function joinGroup(
  communityId: string,
  groupId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userGender?: string,
  userPhoto?: string
): Promise<'active' | 'pending'> {
  try {
    const communityRef = doc(db, 'communities', communityId)
    const communitySnap = await getDoc(communityRef)
    if (!communitySnap.exists()) throw new Error('Community not found')
    const community = communitySnap.data()
    if (!isCommunityVisible(community.status)) {
      throw new Error('This community is not available yet.')
    }

    const communityMemberSnap = await getDocs(
      query(collection(db, 'communities', communityId, 'members'), where('userId', '==', userId))
    )
    if (communityMemberSnap.empty) {
      throw new Error('Join the community first before joining a group.')
    }
    const communityMember = communityMemberSnap.docs[0].data()
    if (communityMember.memberStatus === 'banned') throw new Error('You are banned from this community.')
    if (communityMember.memberStatus === 'suspended') throw new Error('Your membership is suspended.')
    if (!memberCanChat(communityMember.memberStatus)) {
      throw new Error('Your community membership is not active.')
    }

    const groupRef = doc(db, 'communities', communityId, 'groups', groupId)
    const groupSnap = await getDoc(groupRef)
    if (!groupSnap.exists()) {
      throw new Error('Group not found')
    }

    const groupData = groupSnap.data()
    if (!isGroupVisible(groupData.status)) {
      throw new Error('This group is pending admin approval.')
    }

    const genderCheck = canJoinByGenderRestriction(groupData.genderRestriction, userGender)
    if (!genderCheck.allowed) throw new Error(genderCheck.reason || 'Gender restriction applies')

    const requiresApproval = groupData.requiresApproval === true
    const joinStatus = requiresApproval ? 'pending' : 'active'

    const existing = await getDocs(
      query(
        collection(db, 'communities', communityId, 'groups', groupId, 'members'),
        where('userId', '==', userId)
      )
    )
    if (!existing.empty) {
      const row = existing.docs[0].data()
      if (row.memberStatus === 'banned') throw new Error('You are banned from this group.')
      return (row.joinStatus as 'active' | 'pending') || 'active'
    }

    await addDoc(collection(db, 'communities', communityId, 'groups', groupId, 'members'), {
      userId,
      userName,
      userEmail,
      userGender,
      userPhoto,
      joinedAt: Timestamp.now(),
      role: 'member',
      isActive: joinStatus === 'active',
      joinStatus,
      memberStatus: 'active',
    })

    if (joinStatus === 'active') {
      await updateDoc(groupRef, {
        memberCount: increment(1),
        updatedAt: Timestamp.now(),
      })
    }

    void triggerCommunityNotification({
      type: 'group_joined',
      communityId,
      groupId,
      groupName: groupData.name,
      communityName: community.name,
    })

    return joinStatus
  } catch (error) {
    console.error('[v0] Error joining group:', error)
    throw error
  }
}

export async function leaveGroup(
  communityId: string,
  groupId: string,
  userId: string
) {
  try {
    const membersSnapshot = await getDocs(
      query(
        collection(db, 'communities', communityId, 'groups', groupId, 'members'),
        where('userId', '==', userId)
      )
    )

    if (!membersSnapshot.empty) {
      const memberDoc = membersSnapshot.docs[0]
      await deleteDoc(memberDoc.ref)

      // Update group member count
      const groupRef = doc(db, 'communities', communityId, 'groups', groupId)
      const groupSnapshot = await getDocs(
        query(collection(db, 'communities', communityId, 'groups'))
      )
      const group = groupSnapshot.docs.find(d => d.id === groupId)?.data()
      if (group) {
        await updateDoc(groupRef, {
          memberCount: Math.max(0, (group.memberCount || 1) - 1),
        })
      }
    }
  } catch (error) {
    console.error('[v0] Error leaving group:', error)
    throw error
  }
}
