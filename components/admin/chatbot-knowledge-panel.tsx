'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Save, Archive, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BUTTON_PRIMARY } from '@/lib/admin-design-system'
import { adminApiFetch } from '@/lib/admin-api-client'
import type { ChatbotKnowledgeItem, ChatbotKnowledgeStatus } from '@/lib/chatbot-knowledge'

const emptyForm = {
  id: '' as string | undefined,
  title: '',
  content: '',
  triggers: '',
  alwaysInclude: false,
  status: 'active' as ChatbotKnowledgeStatus,
  sortOrder: 0,
}

export function ChatbotKnowledgePanel() {
  const [items, setItems] = useState<ChatbotKnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ ...emptyForm })
  const [showForm, setShowForm] = useState(false)

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
      }),
    })
    setSaving(false)
    if (!json.success) {
      setError(json.error || 'Failed to save')
      return
    }
    setSuccess(form.id ? 'Knowledge updated' : 'Knowledge added')
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
      }),
    })
    if (!json.success) {
      setError(json.error || 'Failed to update status')
      return
    }
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Chatbot knowledge</h2>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Use this for WhatsApp links, contact lines, and facts the bot should paste. Public FAQ
            stays under FAQ Management. Trigger keywords decide when a snippet is included; turn on
            “Always include” for items that should be in every AI reply.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className={`${BUTTON_PRIMARY} !text-white inline-flex items-center gap-2 shrink-0`}
        >
          <Plus className="w-4 h-4" /> Add knowledge
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
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
            {form.id ? 'Edit knowledge' : 'New knowledge'}
          </h3>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-neutral-500">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Business WhatsApp group"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm min-h-[44px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-neutral-500">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Join here: https://chat.whatsapp.com/..."
              rows={4}
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
              placeholder="whatsapp, business group, join chat"
              rows={2}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={form.alwaysInclude}
                onChange={(e) => setForm((f) => ({ ...f, alwaysInclude: e.target.checked }))}
              />
              Always include in AI context
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
          No knowledge items yet. Add WhatsApp links, contact lines, or other facts the bot should
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
                    {item.alwaysInclude && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-black text-white">
                        Always on
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words">
                    {item.content}
                  </p>
                  {item.triggers && (
                    <p className="text-xs text-neutral-500 mt-2">
                      Triggers: {item.triggers}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className={`${BUTTON_PRIMARY} !text-white text-sm`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleArchive(item)}
                    className={`${BUTTON_PRIMARY} !text-white text-sm inline-flex items-center gap-1`}
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
                    className={`${BUTTON_PRIMARY} !text-white text-sm inline-flex items-center gap-1`}
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
