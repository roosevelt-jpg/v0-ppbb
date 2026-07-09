import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'

// Types
export interface Group {
  id: string
  name: string
  description: string
  type: 'member_networking' | 'cause_discussion' | 'business_networking' | 'volunteer_coordination'
  coverImage?: string
  about?: string
  createdBy: string
  createdAt: Timestamp
  memberCount: number
  postCount: number
  isActive: boolean
  causeId?: string
  businessId?: string
  isPublic: boolean
  requiresApproval: boolean
  bannedMembers: string[]
}

export interface GroupPost {
  id: string
  userId: string
  username: string
  userAvatar?: string
  title: string
  content: string
  type: 'discussion' | 'announcement' | 'opportunity' | 'question'
  media: Array<{ type: string; url: string; name: string }>
  createdAt: Timestamp
  commentCount: number
  likesCount: number
  likedBy: string[]
  isPinned: boolean
  isApproved: boolean
  isArchived: boolean
  tags: string[]
}

export interface GroupComment {
  id: string
  userId: string
  username: string
  userAvatar?: string
  content: string
  media?: Array<{ type: string; url: string; name: string }>
  createdAt: Timestamp
  likesCount: number
  likedBy: string[]
  parentCommentId?: string
}

// Group Functions

function getTimestampMillis(value: unknown): number {
  if (!value) return 0
  if (typeof value === 'object' && value !== null) {
    const ts = value as { toMillis?: () => number; seconds?: number }
    if (typeof ts.toMillis === 'function') return ts.toMillis()
    if (typeof ts.seconds === 'number') return ts.seconds * 1000
  }
  if (value instanceof Date) return value.getTime()
  return 0
}

export async function createGroup(
  groupData: Omit<Group, 'id' | 'createdAt' | 'memberCount' | 'postCount'>,
  userId: string
) {
  try {
    const docRef = await addDoc(collection(db, 'groups'), {
      ...groupData,
      createdBy: userId,
      createdAt: serverTimestamp(),
      memberCount: 1,
      postCount: 0,
      bannedMembers: [],
    })

    // Add creator as first member
    await addDoc(collection(db, 'groups', docRef.id, 'members'), {
      userId,
      role: 'admin',
      joinedAt: serverTimestamp(),
      isActive: true,
      isModerator: true,
      joinStatus: 'active',
    })

    return docRef.id
  } catch (error) {
    console.error('[v0] Error creating group:', error)
    throw error
  }
}

export async function getGroup(groupId: string) {
  try {
    const doc = await getDoc(doc(db, 'groups', groupId))
    return doc.data() as Group | undefined
  } catch (error) {
    console.error('[v0] Error getting group:', error)
    throw error
  }
}

export async function getAllGroups(pageSize = 12, startAfterDoc?: any) {
  try {
    const snapshot = await getDocs(query(collection(db, 'groups'), where('isActive', '==', true)))
    let docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[]

    docs.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))

    if (startAfterDoc?.id) {
      const startIndex = docs.findIndex((d) => d.id === startAfterDoc.id)
      if (startIndex >= 0) docs = docs.slice(startIndex + 1)
    }

    const hasMore = docs.length > pageSize
    return {
      groups: hasMore ? docs.slice(0, pageSize) : docs,
      lastDoc: docs[pageSize - 1] || docs[docs.length - 1],
      hasMore,
    }
  } catch (error) {
    console.error('[v0] Error getting groups:', error)
    throw error
  }
}

export async function getGroupsByType(type: string) {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'groups'), where('type', '==', type), where('isActive', '==', true))
    )
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0)) as any[]
  } catch (error) {
    console.error('[v0] Error getting groups by type:', error)
    throw error
  }
}

export async function joinGroup(groupId: string, userId: string) {
  try {
    // Add user as member
    await addDoc(collection(db, 'groups', groupId, 'members'), {
      userId,
      role: 'member',
      joinedAt: serverTimestamp(),
      isActive: true,
      isModerator: false,
      joinStatus: 'active',
    })

    // Increment member count
    await updateDoc(doc(db, 'groups', groupId), {
      memberCount: increment(1),
    })
  } catch (error) {
    console.error('[v0] Error joining group:', error)
    throw error
  }
}

export async function leaveGroup(groupId: string, userId: string) {
  try {
    const q = query(collection(db, 'groups', groupId, 'members'), where('userId', '==', userId))
    const snapshot = await getDocs(q)

    if (snapshot.docs.length > 0) {
      await deleteDoc(snapshot.docs[0].ref)
      await updateDoc(doc(db, 'groups', groupId), {
        memberCount: increment(-1),
      })
    }
  } catch (error) {
    console.error('[v0] Error leaving group:', error)
    throw error
  }
}

export async function isUserMemberOfGroup(groupId: string, userId: string) {
  try {
    const q = query(collection(db, 'groups', groupId, 'members'), where('userId', '==', userId), where('joinStatus', '==', 'active'))
    const snapshot = await getDocs(q)
    return snapshot.docs.length > 0
  } catch (error) {
    console.error('[v0] Error checking membership:', error)
    return false
  }
}

// Post Functions

export async function createPost(groupId: string, postData: Omit<GroupPost, 'id' | 'createdAt' | 'commentCount' | 'likesCount' | 'likedBy'>, userId: string) {
  try {
    const docRef = await addDoc(collection(db, 'groups', groupId, 'posts'), {
      ...postData,
      userId,
      createdAt: serverTimestamp(),
      commentCount: 0,
      likesCount: 0,
      likedBy: [],
      isPinned: false,
      isArchived: false,
      isApproved: false, // Posts require approval by default
    })

    // Increment post count
    await updateDoc(doc(db, 'groups', groupId), {
      postCount: increment(1),
    })

    return docRef.id
  } catch (error) {
    console.error('[v0] Error creating post:', error)
    throw error
  }
}

export async function getGroupPosts(groupId: string, pageSize = 20, startAfterDoc?: any) {
  try {
    let q = query(
      collection(db, 'groups', groupId, 'posts'),
      where('isApproved', '==', true),
      where('isArchived', '==', false),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    )

    if (startAfterDoc) {
      q = query(
        collection(db, 'groups', groupId, 'posts'),
        where('isApproved', '==', true),
        where('isArchived', '==', false),
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc'),
        startAfter(startAfterDoc),
        limit(pageSize + 1)
      )
    }

    const snapshot = await getDocs(q)
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[]

    const hasMore = docs.length > pageSize
    return {
      posts: hasMore ? docs.slice(0, pageSize) : docs,
      lastDoc: docs[pageSize - 1] || docs[docs.length - 1],
      hasMore,
    }
  } catch (error) {
    console.error('[v0] Error getting posts:', error)
    throw error
  }
}

export async function getPost(groupId: string, postId: string) {
  try {
    const postDoc = await getDoc(doc(db, 'groups', groupId, 'posts', postId))
    return postDoc.data() as GroupPost | undefined
  } catch (error) {
    console.error('[v0] Error getting post:', error)
    throw error
  }
}

export async function likePost(groupId: string, postId: string, userId: string) {
  try {
    await updateDoc(doc(db, 'groups', groupId, 'posts', postId), {
      likedBy: arrayUnion(userId),
      likesCount: increment(1),
    })
  } catch (error) {
    console.error('[v0] Error liking post:', error)
    throw error
  }
}

export async function unlikePost(groupId: string, postId: string, userId: string) {
  try {
    await updateDoc(doc(db, 'groups', groupId, 'posts', postId), {
      likedBy: arrayRemove(userId),
      likesCount: increment(-1),
    })
  } catch (error) {
    console.error('[v0] Error unliking post:', error)
    throw error
  }
}

// Comment Functions

export async function addComment(
  groupId: string,
  postId: string,
  commentData: Omit<GroupComment, 'id' | 'createdAt' | 'likesCount' | 'likedBy'>,
  userId: string
) {
  try {
    const docRef = await addDoc(collection(db, 'groups', groupId, 'posts', postId, 'comments'), {
      ...commentData,
      userId,
      createdAt: serverTimestamp(),
      likesCount: 0,
      likedBy: [],
      isApproved: false, // Comments require approval
    })

    // Increment comment count
    await updateDoc(doc(db, 'groups', groupId, 'posts', postId), {
      commentCount: increment(1),
    })

    return docRef.id
  } catch (error) {
    console.error('[v0] Error adding comment:', error)
    throw error
  }
}

export async function getPostComments(groupId: string, postId: string) {
  try {
    const q = query(
      collection(db, 'groups', groupId, 'posts', postId, 'comments'),
      where('isApproved', '==', true),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[]
  } catch (error) {
    console.error('[v0] Error getting comments:', error)
    throw error
  }
}

// File Upload

export async function uploadPostMedia(groupId: string, postId: string, file: File) {
  try {
    const storageRef = ref(storage, `community/groups/${groupId}/posts/${postId}/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    return {
      type: file.type.startsWith('image/') ? 'image' : 'document',
      url,
      name: file.name,
      uploadedAt: new Date(),
    }
  } catch (error) {
    console.error('[v0] Error uploading media:', error)
    throw error
  }
}

// Moderation

export async function flagContent(
  type: 'post' | 'comment' | 'user',
  targetId: string,
  reason: string,
  userId: string,
  groupId: string
) {
  try {
    await addDoc(collection(db, 'communityModeration'), {
      type,
      targetId,
      reason,
      reportedBy: userId,
      reportedAt: serverTimestamp(),
      status: 'pending',
      groupId,
    })
  } catch (error) {
    console.error('[v0] Error flagging content:', error)
    throw error
  }
}

export async function getGroupMembers(groupId: string) {
  try {
    const q = query(collection(db, 'groups', groupId, 'members'), where('joinStatus', '==', 'active'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('[v0] Error getting members:', error)
    throw error
  }
}
