'use client'

import React from 'react'
import { format } from 'date-fns'
import { MessageSquare, ThumbsUp, Plus } from 'lucide-react'
import { auth } from '@/lib/firebase'

type ForumPost = {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string | null
  canOpenProfile?: boolean
  commentCount?: number
  likesCount?: number
  likedBy?: string[]
  createdAt?: string | Date | null
}

type ForumComment = {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string | null
  canOpenProfile?: boolean
  createdAt?: string | Date | null
}

type GroupForumPanelProps = {
  communityId: string
  groupId: string
  currentUserId?: string
  onOpenProfile: (userId: string) => void
}

function asDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export function GroupForumPanel({
  communityId,
  groupId,
  currentUserId,
  onOpenProfile,
}: GroupForumPanelProps) {
  const [posts, setPosts] = React.useState<ForumPost[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [showComposer, setShowComposer] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [activePostId, setActivePostId] = React.useState<string | null>(null)
  const [activePost, setActivePost] = React.useState<ForumPost | null>(null)
  const [comments, setComments] = React.useState<ForumComment[]>([])
  const [commentText, setCommentText] = React.useState('')
  const [detailLoading, setDetailLoading] = React.useState(false)

  const authHeaders = React.useCallback(async () => {
    const token = await auth.currentUser?.getIdToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }, [])

  const loadPosts = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/groups/${groupId}/posts?communityId=${communityId}`, {
        headers,
        cache: 'no-store',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load posts')
      setPosts(json.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forum')
    } finally {
      setLoading(false)
    }
  }, [authHeaders, communityId, groupId])

  React.useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const openPost = async (postId: string) => {
    setActivePostId(postId)
    setDetailLoading(true)
    setCommentText('')
    try {
      const headers = await authHeaders()
      const res = await fetch(
        `/api/groups/${groupId}/posts/${postId}?communityId=${communityId}`,
        { headers, cache: 'no-store' }
      )
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load post')
      setActivePost(json.data.post)
      setComments(json.data.comments || [])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load post')
      setActivePostId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/groups/${groupId}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ communityId, title, content, type: 'discussion' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to create post')
      setTitle('')
      setContent('')
      setShowComposer(false)
      await loadPosts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setSaving(false)
    }
  }

  const toggleLike = async () => {
    if (!activePostId) return
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/groups/${groupId}/posts/${activePostId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ communityId, action: 'like' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to like')
      setActivePost((prev) =>
        prev
          ? { ...prev, likedBy: json.data.likedBy, likesCount: json.data.likesCount }
          : prev
      )
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activePostId
            ? { ...p, likedBy: json.data.likedBy, likesCount: json.data.likesCount }
            : p
        )
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to like post')
    }
  }

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePostId || !commentText.trim()) return
    setSaving(true)
    try {
      const headers = await authHeaders()
      const res = await fetch(`/api/groups/${groupId}/posts/${activePostId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ communityId, action: 'comment', content: commentText }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to comment')
      setComments((prev) => [...prev, json.data])
      setCommentText('')
      setActivePost((prev) =>
        prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to comment')
    } finally {
      setSaving(false)
    }
  }

  const AuthorButton = ({
    userId,
    name,
    avatar,
    canOpen,
  }: {
    userId: string
    name: string
    avatar?: string | null
    canOpen?: boolean
  }) => (
    <button
      type="button"
      disabled={!canOpen}
      onClick={() => canOpen && onOpenProfile(userId)}
      className={`inline-flex items-center gap-2 text-left ${
        canOpen ? 'hover:underline' : 'cursor-default'
      }`}
    >
      {avatar ? (
        <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium">{name}</span>
    </button>
  )

  if (activePostId) {
    return (
      <div className="space-y-4 p-4">
        <button
          type="button"
          onClick={() => {
            setActivePostId(null)
            setActivePost(null)
            setComments([])
          }}
          className="text-sm font-medium text-neutral-700 hover:underline"
        >
          ← Back to discussions
        </button>
        {detailLoading || !activePost ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <article className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
            <AuthorButton
              userId={activePost.authorId}
              name={activePost.authorName}
              avatar={activePost.authorAvatar}
              canOpen={activePost.canOpenProfile}
            />
            <h2 className="font-headline text-xl font-bold break-words">{activePost.title}</h2>
            <p className="text-sm text-neutral-800 whitespace-pre-wrap break-words">
              {activePost.content}
            </p>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <button
                type="button"
                onClick={() => void toggleLike()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-neutral-200 hover:bg-neutral-50"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {activePost.likesCount || 0}
                {currentUserId && activePost.likedBy?.includes(currentUserId) ? ' · Liked' : ''}
              </button>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {comments.length} comments
              </span>
            </div>

            <div className="border-t border-neutral-200 pt-3 space-y-3">
              <h3 className="font-semibold text-sm">Comments</h3>
              {comments.length === 0 ? (
                <p className="text-sm text-neutral-500">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <AuthorButton
                      userId={c.authorId}
                      name={c.authorName}
                      avatar={c.authorAvatar}
                      canOpen={c.canOpenProfile}
                    />
                    <div className="flex-1 min-w-0 bg-neutral-50 rounded-lg p-2">
                      <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        {asDate(c.createdAt) ? format(asDate(c.createdAt)!, 'MMM d, HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <form onSubmit={addComment} className="flex flex-col sm:flex-row gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 min-h-[44px] px-3 border border-neutral-300 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  disabled={saving || !commentText.trim()}
                  className="min-h-[44px] px-4 bg-black text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  Reply
                </button>
              </form>
            </div>
          </article>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-headline text-lg font-bold">Forum</h2>
          <p className="text-xs text-neutral-500">Threaded discussions for this group</p>
        </div>
        <button
          type="button"
          onClick={() => setShowComposer((v) => !v)}
          className="inline-flex items-center gap-1 min-h-[44px] px-3 bg-black text-white rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New post
        </button>
      </div>

      {showComposer && (
        <form onSubmit={createPost} className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className="w-full min-h-[44px] px-3 border border-neutral-300 rounded-lg text-sm"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts…"
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] px-4 bg-black text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Posting…' : 'Publish'}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-neutral-500">Loading discussions…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-neutral-500">No forum posts yet. Start the first discussion.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => void openPost(post.id)}
                className="w-full text-left bg-white border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-200 text-xs font-bold flex items-center justify-center">
                      {(post.authorName || 'M').charAt(0)}
                    </div>
                  )}
                  <span className="text-xs text-neutral-600">{post.authorName}</span>
                </div>
                <h3 className="font-semibold text-base break-words">{post.title}</h3>
                <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{post.content}</p>
                <div className="flex gap-3 mt-2 text-xs text-neutral-500">
                  <span>{post.likesCount || 0} likes</span>
                  <span>{post.commentCount || 0} comments</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
