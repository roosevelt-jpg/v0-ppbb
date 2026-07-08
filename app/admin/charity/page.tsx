'use client'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { Upload, HeartHandshake, Archive } from 'lucide-react'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import {
  CAUSE_CATEGORIES,
  CharityCase,
  normalizeCharityCase,
  progressPercent,
  CharityCaseStatus,
} from '@/lib/charity-cases'

interface PartnerOption {
  id: string
  name: string
}

const emptyForm = {
  title: '',
  description: '',
  category: 'Zakat',
  targetAmount: 0,
  bannerImage: '',
  status: 'draft' as CharityCaseStatus,
  partnerId: '',
}

export default function CharityCasesPage() {
  const [cases, setCases] = React.useState<CharityCase[]>([])
  const [partners, setPartners] = React.useState<PartnerOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [editing, setEditing] = React.useState<CharityCase | null>(null)
  const [bannerFile, setBannerFile] = React.useState<File | null>(null)
  const [editBannerFile, setEditBannerFile] = React.useState<File | null>(null)
  const [form, setForm] = React.useState(emptyForm)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    const unsubCases = onSnapshot(
      collection(db, 'charityCases'),
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => normalizeCharityCase(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => {
            const aMs = (a.createdAt as { toMillis?: () => number })?.toMillis?.() || 0
            const bMs = (b.createdAt as { toMillis?: () => number })?.toMillis?.() || 0
            return bMs - aMs
          })
        setCases(data)
        setLoading(false)
      },
      (err) => {
        console.error('[admin/charity] snapshot error:', err)
        setLoading(false)
      }
    )

    const unsubPartners = onSnapshot(collection(db, 'charityPartners'), (snapshot) => {
      setPartners(
        snapshot.docs.map((d) => ({
          id: d.id,
          name: String((d.data() as { name?: string }).name || 'Partner'),
        }))
      )
    })

    return () => {
      unsubCases()
      unsubPartners()
    }
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')
    try {
      let bannerImage = form.bannerImage
      if (bannerFile) {
        bannerImage = await uploadImageToFirebase(bannerFile, 'charity-cases', {
          preset: 'content',
        })
      }

      await addDoc(
        collection(db, 'charityCases'),
        sanitizeForFirestore({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          targetAmount: Number(form.targetAmount) || 0,
          amountRaised: 0,
          bannerImage,
          status: form.status,
          partnerId: form.partnerId || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      )

      setForm(emptyForm)
      setBannerFile(null)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to create cause')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      let bannerImage = editing.bannerImage
      if (editBannerFile) {
        bannerImage = await uploadImageToFirebase(editBannerFile, 'charity-cases', {
          preset: 'content',
        })
      }

      await updateDoc(
        doc(db, 'charityCases', editing.id),
        sanitizeForFirestore({
          title: editing.title.trim(),
          description: editing.description.trim(),
          category: editing.category,
          targetAmount: Number(editing.targetAmount) || 0,
          bannerImage,
          status: editing.status,
          partnerId: editing.partnerId || null,
          updatedAt: serverTimestamp(),
        })
      )
      setEditing(null)
      setEditBannerFile(null)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to update cause')
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (id: string, status: CharityCaseStatus) => {
    await updateDoc(
      doc(db, 'charityCases', id),
      sanitizeForFirestore({ status, updatedAt: serverTimestamp() })
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this cause?')) return
    await deleteDoc(doc(db, 'charityCases', id))
  }

  const inputClass =
    'w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:border-neutral-900'
  const btnPrimary =
    'min-h-[44px] bg-black hover:bg-neutral-900 text-white px-4 py-2 rounded text-sm font-semibold'
  const btnSecondary =
    'min-h-[44px] bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded text-sm font-semibold'
  const btnDanger =
    'min-h-[44px] bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-semibold'

  return (
    <AdminPageLayout
      title="Charity Cases"
      subtitle="Create and publish donation causes — active cases appear live on /donate"
    >
      <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-100">
          <h2
            className="text-lg mb-4 text-neutral-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Create Cause
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Cause title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              required
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            >
              {CAUSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              placeholder="Target amount (AED)"
              value={form.targetAmount || ''}
              onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) || 0 })}
              className={inputClass}
              required
            />
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as CharityCaseStatus })
              }
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="active">Active (publish)</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={form.partnerId}
              onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
              className={inputClass}
            >
              <option value="">Partner (optional — uses Beit Al Khair fallback)</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                Banner image
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  id="banner-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('banner-upload')?.click()}
                  className={`${btnSecondary} inline-flex items-center gap-2`}
                >
                  <Upload className="w-4 h-4" />
                  {bannerFile ? bannerFile.name : 'Upload banner'}
                </button>
              </div>
            </div>
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} md:col-span-2`}
              rows={3}
              required
            />
            <button type="submit" disabled={saving} className={`${btnPrimary} md:col-span-2`}>
              {saving ? 'Saving…' : 'Create Cause'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-100">
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            All Causes
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-neutral-100 rounded" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12">
              <HeartHandshake className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600 mb-1">No charity cases yet</p>
              <p className="text-sm text-neutral-500">
                Create a cause above and set status to Active to publish on /donate.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-4">
                {cases.map((c) => {
                  const pct = progressPercent(c.amountRaised, c.targetAmount)
                  return (
                    <div key={c.id} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                      <div className="flex gap-3">
                        {c.bannerImage ? (
                          <img
                            src={c.bannerImage}
                            alt=""
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-neutral-100 rounded" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-900 truncate">{c.title}</p>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide">
                            {c.category} · {c.status}
                          </p>
                          <p className="text-xs text-neutral-600 mt-1">
                            AED {c.amountRaised.toLocaleString()} / {c.targetAmount.toLocaleString()} (
                            {pct}%)
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={btnSecondary} onClick={() => setEditing(c)}>
                          Edit
                        </button>
                        {c.status !== 'active' && (
                          <button
                            type="button"
                            className={btnPrimary}
                            onClick={() => setStatus(c.id, 'active')}
                          >
                            Publish
                          </button>
                        )}
                        {c.status === 'active' && (
                          <button
                            type="button"
                            className={btnSecondary}
                            onClick={() => setStatus(c.id, 'archived')}
                          >
                            <Archive className="w-4 h-4 inline mr-1" />
                            Archive
                          </button>
                        )}
                        <button type="button" className={btnDanger} onClick={() => handleDelete(c.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b">
                      <th className="py-3 pr-3">Cause</th>
                      <th className="py-3 pr-3">Category</th>
                      <th className="py-3 pr-3">Progress</th>
                      <th className="py-3 pr-3">Status</th>
                      <th className="py-3 pr-3">Created</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => {
                      const pct = progressPercent(c.amountRaised, c.targetAmount)
                      const created =
                        (c.createdAt as { toDate?: () => Date })?.toDate?.() || null
                      return (
                        <tr key={c.id} className="border-b border-neutral-100 align-top">
                          <td className="py-3 pr-3">
                            <div className="flex gap-2 items-center">
                              {c.bannerImage ? (
                                <img
                                  src={c.bannerImage}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : null}
                              <span className="font-medium">{c.title}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-3">{c.category}</td>
                          <td className="py-3 pr-3">
                            AED {c.amountRaised.toLocaleString()} / {c.targetAmount.toLocaleString()}
                            <div className="w-28 bg-neutral-200 h-1.5 rounded mt-1">
                              <div
                                className="bg-neutral-900 h-1.5 rounded"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                c.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : c.status === 'completed'
                                    ? 'bg-purple-100 text-purple-800'
                                    : c.status === 'archived'
                                      ? 'bg-neutral-200 text-neutral-700'
                                      : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-neutral-500">
                            {created
                              ? formatDistanceToNow(created, { addSuffix: true })
                              : '—'}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="text-neutral-900 underline text-sm"
                                onClick={() => setEditing(c)}
                              >
                                Edit
                              </button>
                              {c.status !== 'active' && (
                                <button
                                  type="button"
                                  className="text-green-700 underline text-sm"
                                  onClick={() => setStatus(c.id, 'active')}
                                >
                                  Publish
                                </button>
                              )}
                              {c.status === 'active' && (
                                <button
                                  type="button"
                                  className="text-neutral-600 underline text-sm"
                                  onClick={() => setStatus(c.id, 'archived')}
                                >
                                  Archive
                                </button>
                              )}
                              <button
                                type="button"
                                className="text-red-600 underline text-sm"
                                onClick={() => handleDelete(c.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
            <h2
              className="text-xl mb-4"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Edit Cause
            </h2>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className={inputClass}
                required
              />
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className={inputClass}
              >
                {CAUSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={editing.targetAmount}
                onChange={(e) =>
                  setEditing({ ...editing, targetAmount: Number(e.target.value) || 0 })
                }
                className={inputClass}
              />
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as CharityCaseStatus })
                }
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={editing.partnerId}
                onChange={(e) => setEditing({ ...editing, partnerId: e.target.value })}
                className={`${inputClass} md:col-span-2`}
              >
                <option value="">No partner (Beit Al Khair fallback)</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Banner
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditBannerFile(e.target.files?.[0] || null)}
                  className={inputClass}
                />
                {editing.bannerImage ? (
                  <img
                    src={editing.bannerImage}
                    alt=""
                    className="mt-2 h-24 object-cover rounded"
                  />
                ) : null}
              </div>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className={`${inputClass} md:col-span-2`}
                rows={3}
              />
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => {
                    setEditing(null)
                    setEditBannerFile(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  )
}
