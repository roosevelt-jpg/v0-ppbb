'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, CheckCircle2, AlertCircle, Upload, ExternalLink } from 'lucide-react'
import { db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { uploadFileToFirebase } from '@/lib/upload-utils'
import {
  LEARNING_TYPE_OPTIONS,
  SPIRITUAL_CATEGORY_OPTIONS,
  subscribeToAllLearningResources,
  type LearningResource,
  type LearningResourceCategory,
  type LearningResourceType,
} from '@/lib/learning-resources'

export default function AdminCmsLearningPage() {
  const [resources, setResources] = useState<LearningResource[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    author: '',
    category: 'meditation' as LearningResourceCategory,
    type: 'article' as LearningResourceType,
    url: '',
    fileUrl: '',
    duration: '',
    status: 'published' as 'draft' | 'published',
  })

  useEffect(() => subscribeToAllLearningResources(setResources), [])

  const showMessage = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadFileToFirebase(file, 'learning/resources')
      setForm((prev) => ({ ...prev, fileUrl: url }))
      showMessage('success', 'File uploaded.')
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Upload failed')
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
    if (!form.url.trim() && !form.fileUrl.trim()) {
      showMessage('error', 'Add a link URL or upload a file.')
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await addDoc(collection(db, 'learningResources'), {
        title: form.title.trim(),
        description: form.description.trim(),
        author: form.author.trim() || null,
        category: form.category,
        type: form.type,
        url: form.url.trim() || null,
        fileUrl: form.fileUrl.trim() || null,
        duration: form.duration.trim() || null,
        status: form.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setForm({
        title: '',
        description: '',
        author: '',
        category: form.category,
        type: 'article',
        url: '',
        fileUrl: '',
        duration: '',
        status: 'published',
      })
      showMessage('success', 'Learning resource published. Members see it on Dashboard → Learning.')
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (resource: LearningResource) => {
    try {
      await updateDoc(doc(db, 'learningResources', resource.id), {
        status: resource.status === 'published' ? 'draft' : 'published',
        updatedAt: serverTimestamp(),
      })
    } catch {
      showMessage('error', 'Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this learning resource?')) return
    try {
      await deleteDoc(doc(db, 'learningResources', id))
      showMessage('success', 'Resource deleted.')
    } catch {
      showMessage('error', 'Failed to delete')
    }
  }

  return (
    <AdminPageLayout
      title="Learning Resources"
      subtitle="Post meditations, reflections, and wisdom articles for members (Dashboard → Learning)"
    >
      <div className="space-y-8 max-w-4xl">
        {message ? (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        ) : null}

        <Card className="p-6 border border-gray-200 dark:border-border space-y-4">
          <h2 className="text-lg font-bold text-black dark:text-foreground">Add resource</h2>
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            Spiritual Development buttons map to: <strong>Daily Meditations</strong>,{' '}
            <strong>Community Reflections</strong>, and <strong>Wisdom Articles</strong>.
          </p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Author</label>
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                placeholder="Optional author name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Spiritual section *</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as LearningResourceCategory })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                >
                  {SPIRITUAL_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                  <option value="general">General learning (top section)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Format</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as LearningResourceType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                >
                  {LEARNING_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Link URL (YouTube, article, etc.)</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Or upload file</label>
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-border rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload size={16} />
                {uploading ? 'Uploading…' : 'Choose file'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleFileUpload(file)
                  }}
                />
              </label>
              {form.fileUrl ? (
                <p className="text-xs text-green-700 mt-2 break-all">Uploaded: {form.fileUrl}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Duration (optional)</label>
                <input
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 10 min"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as 'draft' | 'published' })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                >
                  <option value="published">Published (visible to members)</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={saving || uploading} className="bg-black text-white hover:bg-gray-900">
              <Plus size={16} className="mr-2" />
              {saving ? 'Saving…' : 'Publish resource'}
            </Button>
          </form>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-black dark:text-foreground">All resources ({resources.length})</h2>
          {resources.length === 0 ? (
            <p className="text-gray-500 dark:text-muted-foreground text-sm">No resources yet. Add meditations, reflections, or articles above.</p>
          ) : (
            resources.map((resource) => (
              <Card key={resource.id} className="p-4 border border-gray-200 dark:border-border flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-black dark:text-foreground">{resource.title}</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground capitalize mt-1">
                    {resource.category} · {resource.type} · {resource.status}
                  </p>
                  {resource.description ? (
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1 line-clamp-2">{resource.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {(resource.url || resource.fileUrl) ? (
                    <a
                      href={resource.url || resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg"
                    >
                      <ExternalLink size={14} />
                      Open
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void toggleStatus(resource)}
                    className="px-3 py-1.5 text-sm border rounded-lg"
                  >
                    {resource.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(resource.id)}
                    className="pb-compact-btn h-6 w-6 min-h-0 p-0 rounded-md bg-black !text-white hover:bg-neutral-800 inline-flex items-center justify-center"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminPageLayout>
  )
}
