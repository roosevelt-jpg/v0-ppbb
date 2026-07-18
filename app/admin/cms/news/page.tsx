'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, Upload, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { BUTTON_OUTLINE, BUTTON_PRIMARY } from '@/lib/admin-design-system'
import { useAdminAudit } from '@/lib/use-admin-audit'
import {
  formatNewsDate,
  newsArticleHref,
  slugifyNewsTitle,
  subscribeToAllNews,
  type NewsArticle,
} from '@/lib/news'

export default function AdminCmsNewsPage() {
  const audit = useAdminAudit()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    summary: '',
    body: '',
    category: 'Community',
    author: 'Passive Blessings',
    image: '',
    slug: '',
    isPublished: true,
  })

  useEffect(() => subscribeToAllNews(setArticles), [])

  const showMessage = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadImageToFirebase(file, 'news', { preset: 'content' })
      setForm((prev) => ({ ...prev, image: url }))
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      showMessage('error', 'Title is required.')
      return
    }
    setSaving(true)
    try {
      const slug = form.slug.trim() || slugifyNewsTitle(form.title) || `news-${Date.now()}`
      await addDoc(collection(db, 'news'), {
        title: form.title.trim(),
        summary: form.summary.trim(),
        body: form.body.trim(),
        content: form.body.trim(),
        category: form.category.trim() || 'Community',
        author: form.author.trim() || 'Passive Blessings',
        image: form.image.trim(),
        slug,
        isPublished: form.isPublished,
        publishedAt: form.isPublished ? serverTimestamp() : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).then(async (ref) => {
        audit({
          action: `Created news article: ${form.title.trim()}`,
          actionType: 'create',
          entityType: 'content',
          entityId: ref.id,
          entityName: form.title.trim(),
          status: 'success',
        })
      })
      setForm({
        title: '',
        summary: '',
        body: '',
        category: 'Community',
        author: 'Passive Blessings',
        image: '',
        slug: '',
        isPublished: true,
      })
      showMessage('success', 'Article created. It appears on Press Room when published.')
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to create article')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (article: NewsArticle) => {
    try {
      const next = !article.isPublished
      await updateDoc(doc(db, 'news', article.id), {
        isPublished: next,
        publishedAt: next ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      })
      audit({
        action: `${next ? 'Published' : 'Unpublished'} news: ${article.title}`,
        actionType: 'update',
        entityType: 'content',
        entityId: article.id,
        entityName: article.title,
        status: 'success',
      })
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Update failed')
    }
  }

  const handleDelete = async (article: NewsArticle) => {
    if (!confirm(`Delete “${article.title}”?`)) return
    try {
      await deleteDoc(doc(db, 'news', article.id))
      audit({
        action: `Deleted news: ${article.title}`,
        actionType: 'delete',
        entityType: 'content',
        entityId: article.id,
        entityName: article.title,
        status: 'success',
      })
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Delete failed')
    }
  }

  return (
    <AdminPageLayout
      title="News & Press Room"
      subtitle="Publish blog posts that appear on the homepage Press Room and /news"
    >
      <div className="space-y-6 max-w-4xl">
        {message ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'border-neutral-300 bg-neutral-50 text-neutral-900'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <Card className="p-4 sm:p-6">
          <h2 className="font-semibold text-lg mb-4">New article</h2>
          <form onSubmit={(e) => void handleAdd(e)} className="space-y-3">
            <label className="block text-sm">
              Title *
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                placeholder="Community workshop draws 200 guests"
              />
            </label>
            <label className="block text-sm">
              Summary
              <textarea
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm min-h-[72px]"
                placeholder="Short teaser for cards…"
              />
            </label>
            <label className="block text-sm">
              Body
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm min-h-[140px]"
                placeholder="Full article text (plain text or simple HTML)…"
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                Category
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                Author
                <input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block text-sm">
              URL slug (optional)
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                placeholder="auto-generated from title if empty"
              />
            </label>
            <div className="space-y-2">
              <p className="text-sm font-medium">Featured image</p>
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt=""
                  className="w-full max-w-sm aspect-[4/3] object-cover rounded border border-neutral-200"
                />
              ) : null}
              <label className={`${BUTTON_OUTLINE} inline-flex gap-1 cursor-pointer`}>
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading…' : form.image ? 'Replace image' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleImageUpload(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              Publish immediately (show on homepage Press Room + /news)
            </label>
            <button type="submit" disabled={saving || uploading} className={`${BUTTON_PRIMARY} gap-1`}>
              <Plus className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Create article'}
            </button>
          </form>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg">All articles ({articles.length})</h2>
          {articles.length === 0 ? (
            <p className="text-sm text-neutral-600">No articles yet.</p>
          ) : (
            articles.map((article) => (
              <Card key={article.id} className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
                  <div className="min-w-0 flex gap-3">
                    {article.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.image}
                        alt=""
                        className="w-20 h-16 object-cover rounded border border-neutral-200 shrink-0"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="font-semibold break-words">{article.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {article.isPublished ? 'Published' : 'Draft'} ·{' '}
                        {formatNewsDate(article.publishedAt) || '—'} · By {article.author}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link
                      href={newsArticleHref(article)}
                      target="_blank"
                      className={`${BUTTON_OUTLINE} gap-1`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => void togglePublish(article)}
                      className={`${BUTTON_OUTLINE} gap-1`}
                    >
                      {article.isPublished ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Publish
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(article)}
                      className={`${BUTTON_PRIMARY} gap-1`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminPageLayout>
  )
}
