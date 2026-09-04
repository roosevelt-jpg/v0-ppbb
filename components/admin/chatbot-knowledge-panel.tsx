'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Save, Archive, RotateCcw, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BUTTON_PRIMARY } from '@/lib/admin-design-system'
import { adminApiFetch } from '@/lib/admin-api-client'
import type { ChatbotKnowledgeItem, ChatbotKnowledgeStatus } from '@/lib/chatbot-knowledge'
import { isTextTrainingFile, suggestTriggersFromDoc } from '@/lib/chatbot-retrieval'

const emptyForm = {
  id: '' as string | undefined,
  title: '',
  content: '',
  triggers: '',
  alwaysInclude: false,
  status: 'active' as ChatbotKnowledgeStatus,
  sortOrder: 0,
  sourceFileName: '' as string | undefined,
}

const MAX_DOC_CHARS = 200_000

export function ChatbotKnowledgePanel() {
  const [items, setItems] = useState<ChatbotKnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ ...emptyForm })
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const json = await adminApiFetch<ChatbotKnowledgeItem[]>(
      '/api/admin/chatbot-knowledge?includeArchived=true'
    )
    if (!json.success) {
      setError(json.error || 'Failed to load knowledge')
      setItems([])
    } else {
      setItems(json.data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const startCreate = () => {
    setForm({ ...emptyForm })
    setShowForm(true)
    setSuccess('')
    setError('')
  }

  const startEdit = (item: ChatbotKnowledgeItem) => {
    setForm({
      id: item.id,
      title: item.title,
      content: item.content,
      triggers: item.triggers,
      alwaysInclude: item.alwaysInclude,
      status: item.status,
      sortOrder: item.sortOrder,
      sourceFileName: item.sourceFileName || '',
    })
    setShowForm(true)
    setSuccess('')
    setError('')
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    const json = await adminApiFetch<ChatbotKnowledgeItem>('/api/admin/chatbot-knowledge', {
      method: 'POST',
      body: JSON.stringify({
        id: form.id || undefined,
        title: form.title.trim(),
        content: form.content.trim(),
        triggers: form.triggers,
        alwaysInclude: form.alwaysInclude,
        status: form.status,
        sortOrder: form.sortOrder,
        sourceFileName: form.sourceFileName || undefined,
      }),
    })
    setSaving(false)
    if (!json.success) {
      setError(json.error || 'Failed to save')
      return
    }
    setSuccess(form.id ? 'Training content updated' : 'Training content added')
    setShowForm(false)
    setForm({ ...emptyForm })
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge item permanently?')) return
    setError('')
    const json = await adminApiFetch(`/api/admin/chatbot-knowledge?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!json.success) {
      setError(json.error || 'Failed to delete')
      return
    }
    setSuccess('Knowledge deleted')
    await load()
  }

  const toggleArchive = async (item: ChatbotKnowledgeItem) => {
    const nextStatus: ChatbotKnowledgeStatus = item.status === 'active' ? 'archived' : 'active'
    const json = await adminApiFetch('/api/admin/chatbot-knowledge', {
      method: 'POST',
      body: JSON.stringify({
        id: item.id,
        title: item.title,
        content: item.content,
        triggers: item.triggers,
        alwaysInclude: item.alwaysInclude,
        status: nextStatus,
        sortOrder: item.sortOrder,
        sourceFileName: item.sourceFileName,
      }),
    })
    if (!json.success) {
      setError(json.error || 'Failed to update status')
      return
    }
    await load()
  }

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    setSuccess('')

    let saved = 0
    const failures: string[] = []

    for (const file of Array.from(files)) {
      if (!isTextTrainingFile(file.name, file.type)) {
        failures.push(`${file.name}: use .txt, .md, .csv, or .json (export PDF as text first)`)
        continue
      }
      if (file.size > 2_000_000) {
        failures.push(`${file.name}: file too large (max 2MB)`)
        continue
      }

      try {
        let text = await file.text()
        text = text.replace(/\u0000/g, '').trim()
        if (!text) {
          failures.push(`${file.name}: empty file`)
          continue
        }
        if (text.length > MAX_DOC_CHARS) {
          text = text.slice(0, MAX_DOC_CHARS)
        }

        const title = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() || file.name
        const triggers = suggestTriggersFromDoc(title, text)
        const json = await adminApiFetch<ChatbotKnowledgeItem>('/api/admin/chatbot-knowledge', {
          method: 'POST',
          body: JSON.stringify({
            title,
            content: text,
            triggers,
            alwaysInclude: false,
            status: 'active',
            sortOrder: items.length + saved,
            sourceFileName: file.name,
          }),
        })
        if (!json.success) {
          failures.push(`${file.name}: ${json.error || 'save failed'}`)
        } else {
          saved += 1
        }
      } catch (err) {
        failures.push(
          `${file.name}: ${err instanceof Error ? err.message : 'could not read file'}`
        )
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (saved > 0) {
      setSuccess(
        `Uploaded ${saved} training doc${saved === 1 ? '' : 's'}. The chatbot will answer from this content.`
      )
      await load()
    }
    if (failures.length > 0) {
      setError(failures.join('\n'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">AI training docs & knowledge</h2>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            The chatbot prefers Anthropic (from Admin → Integrations) with these notes as context, and falls back to FAQ/knowledge matching when the API is unavailable.
            Upload training documents (.txt, .md, .csv, .json) or paste facts, WhatsApp links, and
            contact lines. Add trigger keywords so the bot matches the right doc to each question.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,.csv,.json,text/plain,text/markdown,text/csv,application/json"
            multiple
            className="hidden"
            onChange={(e) => void handleUploadFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`${BUTTON_PRIMARY} !text-white inline-flex items-center gap-2`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload training docs'}
          </button>
          <button
            type="button"
            onClick={startCreate}
            className={`${BUTTON_PRIMARY} !text-white inline-flex items-center gap-2`}
          >
            <Plus className="w-4 h-4" /> Add manually
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 whitespace-pre-wrap">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {success}
        </div>
      )}

      {showForm && (
        <Card className="p-4 sm:p-6 border border-neutral-200 space-y-4">
          <h3 className="font-semibold text-neutral-900">
            {form.id ? 'Edit training content' : 'New training content'}
          </h3>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-neutral-500">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Membership guide"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-neutral-500">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Paste FAQ-style answers, policies, WhatsApp links, or full training document text…"
              rows={8}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-neutral-500">
              Triggers (comma or newline)
            </label>
            <textarea
              value={form.triggers}
              onChange={(e) => setForm((f) => ({ ...f, triggers: e.target.value }))}
              placeholder="membership, join, how to join, dues"
              rows={2}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm"
            />
            <p className="text-xs text-neutral-500">
              Keywords that should pull this document into the answer.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={form.alwaysInclude}
                onChange={(e) => setForm((f) => ({ ...f, alwaysInclude: e.target.checked }))}
              />
              Always include (e.g. contact / WhatsApp)
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
              Sort order
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                }
                className="w-20 border border-neutral-300 rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value === 'archived' ? 'archived' : 'active',
                  }))
                }
                className="border border-neutral-300 rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className={`${BUTTON_PRIMARY} !text-white inline-flex items-center gap-2`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setForm({ ...emptyForm })
              }}
              className={`${BUTTON_PRIMARY} !text-white`}
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading knowledge…</p>
      ) : items.length === 0 ? (
        <Card className="p-8 border border-neutral-200 text-center text-neutral-500 text-sm">
          No training content yet. Upload documents or add WhatsApp links and facts the bot should
          share.
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4 border border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                    <span
                      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.sourceFileName && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-neutral-900 text-white">
                        Doc
                      </span>
                    )}
                    {item.alwaysInclude && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-black text-white">
                        Always on
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words line-clamp-6">
                    {item.content}
                  </p>
                  {item.sourceFileName && (
                    <p className="text-xs text-neutral-500 mt-2">File: {item.sourceFileName}</p>
                  )}
                  {item.triggers && (
                    <p className="text-xs text-neutral-500 mt-2">Triggers: {item.triggers}</p>
                  )}
                </div>
                <div className="flex flex-nowrap items-center gap-1 shrink-0 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="h-8 px-2.5 rounded-md bg-black text-white text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleArchive(item)}
                    className="h-8 px-2.5 rounded-md bg-black text-white text-xs font-semibold inline-flex items-center gap-1"
                    title={item.status === 'active' ? 'Archive' : 'Restore'}
                  >
                    {item.status === 'active' ? (
                      <Archive className="w-3.5 h-3.5" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    {item.status === 'active' ? 'Archive' : 'Restore'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    className="h-8 px-2.5 rounded-md bg-black text-white text-xs font-semibold inline-flex items-center gap-1"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
