'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { getGroup, getGroupPosts, joinGroup, createPost, addComment, getPostComments, uploadPostMedia } from '@/lib/community-service'
import { MemberHeader } from '@/components/member-layout'
import { MediaUpload } from '@/components/media-upload'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Users, Heart, Share2, Flag, Send, Upload, X, FileText, ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Group {
  id: string
  name: string
  description: string
  about?: string
  memberCount: number
  postCount: number
  coverImage?: string
  type: string
}

interface Post {
  id: string
  userId: string
  username: string
  userAvatar?: string
  title: string
  content: string
  type: string
  media: Array<{ type: string; url: string; name: string }>
  createdAt: any
  commentCount: number
  likesCount: number
  likedBy: string[]
  isPinned: boolean
}

interface Comment {
  id: string
  userId: string
  username: string
  userAvatar?: string
  content: string
  media?: Array<{ type: string; url: string; name: string }>
  createdAt: any
  likesCount: number
}

export default function GroupPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupId as string

  const [group, setGroup] = React.useState<Group | null>(null)
  const [posts, setPosts] = React.useState<Post[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isMember, setIsMember] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Create post state
  const [showCreatePost, setShowCreatePost] = React.useState(false)
  const [postTitle, setPostTitle] = React.useState('')
  const [postContent, setPostContent] = React.useState('')
  const [postType, setPostType] = React.useState('discussion')
  const [postMedia, setPostMedia] = React.useState<File[]>([])

  // Comment state per post
  const [commentStates, setCommentStates] = React.useState<Record<string, { comments: Comment[]; newComment: string; showComments: boolean }>>({})

  // Load group
  React.useEffect(() => {
    const loadGroup = async () => {
      try {
        const groupData = await getGroup(groupId)
        if (groupData) {
          setGroup({ id: groupId, ...groupData } as any)
        }
        setLoading(false)
      } catch (error) {
        console.error('[v0] Error loading group:', error)
        setLoading(false)
      }
    }

    loadGroup()
  }, [groupId])

  // Load posts
  React.useEffect(() => {
    if (!groupId) return

    const unsubscribe = onSnapshot(
      query(collection(db, 'groups', groupId, 'posts')),
      (snapshot) => {
        const postsData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[]
        postsData.sort((a, b) => {
          if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
            return Number(b.isPinned) - Number(a.isPinned)
          }
          const aTime = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0
          const bTime = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0
          return bTime - aTime
        })
        setPosts(postsData)
      },
      (error) => {
        console.error('[v0] Error loading posts:', error)
      }
    )

    return () => unsubscribe()
  }, [groupId])

  // Check membership
  React.useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser || !groupId) return

    // Check if user is member (simplified)
    const checkMembership = async () => {
      try {
        // In production, check membership collection
        setIsMember(true)
      } catch (error) {
        console.error('[v0] Error checking membership:', error)
      }
    }

    checkMembership()
  }, [groupId])

  const handleJoinGroup = async () => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    try {
      await joinGroup(groupId, firebaseUser.uid)
      setIsMember(true)
    } catch (error) {
      console.error('[v0] Error joining group:', error)
    }
  }

  const handleCreatePost = async () => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser || !postTitle.trim() || !postContent.trim()) return

    try {
      const mediaUrls: Array<{ type: string; url: string; name: string }> = []

      // Upload media files if any
      if (postMedia.length > 0) {
        for (const file of postMedia) {
          try {
            const mediaData = await uploadPostMedia(groupId, 'temp_post_id', file)
            mediaUrls.push(mediaData as any)
          } catch (error) {
            console.error('[v0] Error uploading media:', error)
          }
        }
      }

      await createPost(
        groupId,
        {
          userId: firebaseUser.uid,
          username: firebaseUser.displayName || 'Anonymous',
          title: postTitle,
          content: postContent,
          type: postType as any,
          media: mediaUrls,
          isApproved: true,
          isPinned: false,
          isArchived: false,
          tags: [],
          visibility: 'public',
          flagCount: 0,
          likedBy: [],
          likesCount: 0,
          commentCount: 0,
        },
        firebaseUser.uid
      )

      setPostTitle('')
      setPostContent('')
      setPostMedia([])
      setShowCreatePost(false)
    } catch (error) {
      console.error('[v0] Error creating post:', error)
    }
  }

  const handleAddComment = async (postId: string) => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    const commentState = commentStates[postId]
    if (!commentState?.newComment.trim()) return

    try {
      await addComment(
        groupId,
        postId,
        {
          userId: firebaseUser.uid,
          username: firebaseUser.displayName || 'Anonymous',
          content: commentState.newComment,
          likesCount: 0,
          likedBy: [],
          isApproved: true,
          isDeleted: false,
        },
        firebaseUser.uid
      )

      setCommentStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], newComment: '' },
      }))
    } catch (error) {
      console.error('[v0] Error adding comment:', error)
    }
  }

  const loadComments = async (postId: string) => {
    try {
      const comments = await getPostComments(groupId, postId)
      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          comments: comments as any,
          newComment: prev[postId]?.newComment || '',
          showComments: true,
        },
      }))
    } catch (error) {
      console.error('[v0] Error loading comments:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <MemberHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 p-8 text-center">Loading...</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <MemberHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 p-8">
          <Card className="p-8 text-center">
            <p className="text-gray-600">Group not found</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MemberHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 p-6 lg:p-8">
        {/* Group Header */}
        <div className="mb-8">
          {group.coverImage && (
            <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg mb-4 overflow-hidden">
              <img src={group.coverImage} alt={group.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{group.name}</h1>
              <p className="text-gray-600">{group.description}</p>
            </div>
            {!isMember && <Button onClick={handleJoinGroup}>Join Group</Button>}
          </div>

          {group.about && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-gray-700">{group.about}</p>
            </div>
          )}

          <div className="flex gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{group.memberCount} members</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{group.postCount} discussions</span>
            </div>
          </div>
        </div>

        {isMember && (
          <>
            {/* Create Post */}
            {showCreatePost ? (
              <Card className="p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Start a Discussion</h3>
                  <button onClick={() => setShowCreatePost(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <Input
                  placeholder="Discussion title..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="mb-4"
                />

                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-4"
                >
                  <option value="discussion">Discussion</option>
                  <option value="question">Question</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="announcement">Announcement</option>
                </select>

                <Textarea
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  className="mb-4"
                />

                {/* Media Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attach Images or Documents</label>
                  <MediaUpload
                    onFilesAdded={(files) => {
                      setPostMedia(files.map((f) => f.file))
                    }}
                    maxFiles={5}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreatePost} className="bg-black hover:bg-gray-800">
                    Post
                  </Button>
                  <Button onClick={() => setShowCreatePost(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </Card>
            ) : (
              <Button onClick={() => setShowCreatePost(true)} className="mb-8 bg-black hover:bg-gray-800 w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start a Discussion
              </Button>
            )}

            {/* Posts */}
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="p-6">
                  {/* Post Header */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{post.title}</h3>
                      <Flag className="w-4 h-4 text-gray-400 cursor-pointer hover:text-red-500" />
                    </div>
                    <p className="text-sm text-gray-600">
                      By {post.username} · {post.createdAt?.toDate?.()?.toLocaleDateString()}
                    </p>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-800 mb-4">{post.content}</p>

                  {/* Media */}
                  {post.media && post.media.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {post.media.map((m, i) => (
                          m.type === 'image' ? (
                            <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="relative group overflow-hidden rounded-lg bg-gray-200 h-24">
                              <img src={m.url} alt={m.name} className="w-full h-full object-cover group-hover:opacity-80 transition" />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                              </div>
                            </a>
                          ) : (
                            <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-blue-500 transition group">
                              <FileText className="w-5 h-5 text-gray-500 group-hover:text-black transition" />
                              <span className="text-xs text-gray-600 group-hover:text-black truncate">{m.name}</span>
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div className="flex gap-6 text-sm text-gray-600 mb-4 pb-4 border-b">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.likesCount} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentCount} comments</span>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div>
                    <button
                      onClick={() => {
                        if (!commentStates[post.id]?.showComments) {
                          loadComments(post.id)
                        } else {
                          setCommentStates((prev) => ({
                            ...prev,
                            [post.id]: {
                              ...prev[post.id],
                              showComments: !prev[post.id]?.showComments,
                            },
                          }))
                        }
                      }}
                      className="text-black text-sm font-medium mb-4"
                    >
                      {commentStates[post.id]?.showComments ? 'Hide' : 'Show'} {post.commentCount} comments
                    </button>

                    {commentStates[post.id]?.showComments && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4">
                        {commentStates[post.id]?.comments?.map((comment) => (
                          <div key={comment.id} className="bg-white rounded p-3">
                            <p className="text-sm font-medium text-gray-900">{comment.username}</p>
                            <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentStates[post.id]?.newComment || ''}
                        onChange={(e) =>
                          setCommentStates((prev) => ({
                            ...prev,
                            [post.id]: {
                              ...prev[post.id],
                              newComment: e.target.value,
                              showComments: prev[post.id]?.showComments || false,
                              comments: prev[post.id]?.comments || [],
                            },
                          }))
                        }
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <Button
                        onClick={() => handleAddComment(post.id)}
                        size="sm"
                        className="bg-black hover:bg-gray-800"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {posts.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-gray-600 mb-4">No discussions yet in this group.</p>
                <Button onClick={() => setShowCreatePost(true)} className="bg-black hover:bg-gray-800">
                  Start First Discussion
                </Button>
              </Card>
            )}
          </>
        )}

        {!isMember && (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">Join this group to view and participate in discussions</p>
            <Button onClick={handleJoinGroup} className="bg-black hover:bg-gray-800">
              Join Group
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
