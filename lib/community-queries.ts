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
  getDocs,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Community, Group, Message, GroupMember, CommunityMember } from './community-types'

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const communities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      })) as Community[]
      onData(communities)
    })

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
    const unsubscribe = onSnapshot(doc(db, 'communities', communityId), (snapshot) => {
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
    })

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
  try {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'communities'),
        where('members', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const communities = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        })) as Community[]
        onData(communities)
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
        const groups = snapshot.docs.map((doc) => ({
          id: doc.id,
          communityId,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        })) as Group[]
        onData(groups)
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
        orderBy('timestamp', 'asc'),
        limit(100)
      ),
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          communityId,
          groupId,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
          editedAt: doc.data().editedAt?.toDate?.() || doc.data().editedAt,
        })) as Message[]
        onData(messages)
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
      memberCount: 1,
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
      memberCount: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Increment community group count
    await updateDoc(doc(db, 'communities', communityId), {
      groupCount: arrayUnion(),
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
    // Add member to community
    await addDoc(collection(db, 'communities', communityId, 'members'), {
      userId,
      userName,
      userEmail,
      userGender,
      userPhoto,
      joinedAt: Timestamp.now(),
      role: 'member',
      isActive: true,
    })

    // Update member count
    const communityRef = doc(db, 'communities', communityId)
    const communityDoc = await getDocs(query(collection(db, 'communities')))
    const community = communityDoc.docs.find(d => d.id === communityId)?.data()
    if (community) {
      await updateDoc(communityRef, {
        memberCount: (community.memberCount || 0) + 1,
      })
    }
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

export async function joinGroup(
  communityId: string,
  groupId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userGender?: string,
  userPhoto?: string
) {
  try {
    await addDoc(collection(db, 'communities', communityId, 'groups', groupId, 'members'), {
      userId,
      userName,
      userEmail,
      userGender,
      userPhoto,
      joinedAt: Timestamp.now(),
      role: 'member',
      isActive: true,
    })

    // Update group member count
    const groupRef = doc(db, 'communities', communityId, 'groups', groupId)
    const groupSnapshot = await getDocs(
      query(collection(db, 'communities', communityId, 'groups'))
    )
    const group = groupSnapshot.docs.find(d => d.id === groupId)?.data()
    if (group) {
      await updateDoc(groupRef, {
        memberCount: (group.memberCount || 0) + 1,
      })
    }
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
