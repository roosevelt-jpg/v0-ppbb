import { db } from '@/lib/firebase'
import { doc, updateDoc, deleteDoc, arrayUnion, Timestamp } from 'firebase/firestore'

// Add emoji reaction to message
export async function addEmojiReaction(
  communityId: string,
  groupId: string,
  messageId: string,
  emoji: string,
  userId: string
) {
  try {
    const messageRef = doc(db, `communities/${communityId}/groups/${groupId}/messages/${messageId}`)
    
    // Check if reaction already exists
    const reactions = await getMessageReactions(communityId, groupId, messageId)
    const existingReaction = reactions.find((r) => r.emoji === emoji)
    
    if (existingReaction) {
      if (!existingReaction.users.includes(userId)) {
        existingReaction.users.push(userId)
      }
    } else {
      reactions.push({ emoji, users: [userId] })
    }
    
    await updateDoc(messageRef, { reactions })
    return true
  } catch (error) {
    console.error('[v0] Error adding reaction:', error)
    return false
  }
}

// Remove emoji reaction from message
export async function removeEmojiReaction(
  communityId: string,
  groupId: string,
  messageId: string,
  emoji: string,
  userId: string
) {
  try {
    const messageRef = doc(db, `communities/${communityId}/groups/${groupId}/messages/${messageId}`)
    
    const reactions = await getMessageReactions(communityId, groupId, messageId)
    const reactionIndex = reactions.findIndex((r) => r.emoji === emoji)
    
    if (reactionIndex !== -1) {
      const userIndex = reactions[reactionIndex].users.indexOf(userId)
      if (userIndex !== -1) {
        reactions[reactionIndex].users.splice(userIndex, 1)
        
        // Remove reaction if no users left
        if (reactions[reactionIndex].users.length === 0) {
          reactions.splice(reactionIndex, 1)
        }
      }
    }
    
    await updateDoc(messageRef, { reactions })
    return true
  } catch (error) {
    console.error('[v0] Error removing reaction:', error)
    return false
  }
}

// Get reactions for a message
export async function getMessageReactions(
  communityId: string,
  groupId: string,
  messageId: string
) {
  try {
    const messageRef = doc(db, `communities/${communityId}/groups/${groupId}/messages/${messageId}`)
    const snapshot = await (await import('firebase/firestore')).getDoc(messageRef)
    return snapshot.data()?.reactions || []
  } catch (error) {
    console.error('[v0] Error getting reactions:', error)
    return []
  }
}

// Edit message
export async function editMessage(
  communityId: string,
  groupId: string,
  messageId: string,
  newContent: string
) {
  try {
    const messageRef = doc(db, `communities/${communityId}/groups/${groupId}/messages/${messageId}`)
    await updateDoc(messageRef, {
      content: newContent,
      edited: true,
      editedAt: Timestamp.now(),
    })
    return true
  } catch (error) {
    console.error('[v0] Error editing message:', error)
    return false
  }
}

// Delete message (soft delete)
export async function deleteMessage(
  communityId: string,
  groupId: string,
  messageId: string
) {
  try {
    const messageRef = doc(db, `communities/${communityId}/groups/${groupId}/messages/${messageId}`)
    await updateDoc(messageRef, {
      isDeleted: true,
      deletedAt: Timestamp.now(),
      content: '[Message deleted]',
    })
    return true
  } catch (error) {
    console.error('[v0] Error deleting message:', error)
    return false
  }
}

// Mark message as read
export async function markMessageAsRead(
  communityId: string,
  groupId: string,
  messageId: string,
  userId: string
) {
  try {
    const messageRef = doc(db, `communities/${communityId}/groups/${groupId}/messages/${messageId}`)
    
    const message = await (await import('firebase/firestore')).getDoc(messageRef)
    const readBy = message.data()?.readBy || []
    
    if (!readBy.find((r: any) => r.userId === userId)) {
      readBy.push({ userId, readAt: Timestamp.now() })
      await updateDoc(messageRef, { readBy })
    }
    
    return true
  } catch (error) {
    console.error('[v0] Error marking as read:', error)
    return false
  }
}

// Update user presence
export async function updateUserPresence(
  communityId: string,
  groupId: string,
  userId: string,
  status: 'online' | 'away' | 'offline',
  isTyping?: boolean
) {
  try {
    const presenceRef = doc(db, `communities/${communityId}/groups/${groupId}/presence/${userId}`)
    await updateDoc(presenceRef, {
      status,
      lastSeen: Timestamp.now(),
      isTyping: isTyping || false,
    })
    return true
  } catch (error) {
    // If doc doesn't exist, create it
    try {
      const presenceRef = doc(db, `communities/${communityId}/groups/${groupId}/presence/${userId}`)
      await (await import('firebase/firestore')).setDoc(presenceRef, {
        userId,
        status,
        lastSeen: Timestamp.now(),
        isTyping: isTyping || false,
      })
      return true
    } catch (err) {
      console.error('[v0] Error updating presence:', err)
      return false
    }
  }
}
