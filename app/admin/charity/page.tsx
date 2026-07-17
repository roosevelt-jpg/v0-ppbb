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
  setDoc,
  getDocs,
} from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { Upload, HeartHandshake, Archive, RefreshCw } from 'lucide-react'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { ACTION_ROW, BUTTON_ROW_COMPACT } from '@/lib/admin-design-system'
import {
  CAUSE_CATEGORIES,
  CharityCase,
  normalizeCharityCase,
  progressPercent,
  CharityCaseStatus,
  mergeCharityCaseLists,
} from '@/lib/charity-cases'
import { useAdminAudit } from '@/lib/use-admin-audit'

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
  const audit = useAdminAudit()
  const [cases, setCases] = React.useState<CharityCase[]>([])
  const [partners, setPartners] = React.useState<PartnerOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [editing, setEditing] = React.useState<CharityCase | null>(null)
  const [bannerFile, setBannerFile] = React.useState<File | null>(null)
  const [editBannerFile, setEditBannerFile] = React.useState<File | null>(null)
  const [form, setForm] = React.useState(emptyForm)
  const [error, setError] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | 'active' | 'draft' | 'archived'>('all')

  React.useEffect(() => {
    let fromCases: CharityCase[] = []
    let fromLegacy: CharityCase[] = []
    let casesReady = false
    let legacyReady = false

    const merge = () => {
      if (!casesReady || !legacyReady) return
      setCases(mergeCharityCaseLists(fromCases, fromLegacy))
      setLoading(false)
    }

    const unsubCases = onSnapshot(
      collection(db, 'charityCases'),
      (snapshot) => {
        fromCases = snapshot.docs.map((d) =>
          normalizeCharityCase(d.id, d.data() as Record<string, unknown>, 'charityCases')
        )
        casesReady = true
        merge()
      },
      (err) => {
        console.error('[admin/charity] charityCases error:', err)
        casesReady = true
        merge()
      }
    )

    const unsubLegacy = onSnapshot(
      collection(db, 'causes'),
      (snapshot) => {
        fromLegacy = snapshot.docs.map((d) =>
          normalizeCharityCase(d.id, d.data() as Record<string, unknown>, 'causes')
        )
        legacyReady = true
        merge()
      },
      (err) => {
        console.error('[admin/charity] causes (legacy) error:', err)
        legacyReady = true
        merge()
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
      unsubLegacy()
      unsubPartners()
    }
  }, [])

  const collectionFor = (c: CharityCase) =>
    c.sourceCollection === 'causes' ? 'causes' : 'charityCases'

  const importLegacyCauses = async () => {
    setImporting(true)
    setError('')
    try {
      const legacySnap = await getDocs(collection(db, 'causes'))
      let imported = 0
      for (const d of legacySnap.docs) {
        const data = d.data() as Record<string, unknown>
        const normalized = normalizeCharityCase(d.id, data, 'causes')
        await setDoc(
          doc(db, 'charityCases', d.id),
          sanitizeForFirestore({
            title: normalized.title,
            description: normalized.description,
            category: normalized.category,
            targetAmount: normalized.targetAmount,
            amountRaised: normalized.amountRaised,
            bannerImage: normalized.bannerImage,
            status: normalized.status,
            partnerId: normalized.partnerId || null,
            partnerName: normalized.partnerName || null,
            migratedFrom: 'causes',
            createdAt: data.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        )
        imported += 1
      }
      audit({
        actionType: 'update',
        action: `Imported ${imported} legacy cause(s) into charityCases`,
        entityType: 'beneficiary',
        status: 'success',
      })
      alert(
        imported
          ? `Imported ${imported} cause(s) into Charity Cases. You can edit them here.`
          : 'No legacy causes found to import.'
      )
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

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

      const ref = await addDoc(
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
      audit({
        actionType: 'create',
        action: `Created charity cause: ${form.title}`,
        entityType: 'beneficiary',
        entityId: ref.id,
        entityName: form.title,
        status: 'success',
      })

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
        doc(db, collectionFor(editing), editing.id),
        sanitizeForFirestore({
          title: editing.title.trim(),
          description: editing.description.trim(),
          category: editing.category,
          targetAmount: Number(editing.targetAmount) || 0,
          // Keep legacy field names in sync when editing old causes docs
          ...(collectionFor(editing) === 'causes'
            ? {
                goalAmount: Number(editing.targetAmount) || 0,
                currentAmount: Number(editing.amountRaised) || 0,
                image: bannerImage,
              }
            : {}),
          bannerImage,
          status: editing.status,
          partnerId: editing.partnerId || null,
          updatedAt: serverTimestamp(),
        })
      )
      audit({
        actionType: 'update',
        action: `Updated charity cause: ${editing.title}`,
        entityType: 'beneficiary',
        entityId: editing.id,
        entityName: editing.title,
        status: 'success',
      })
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
    const item = cases.find((c) => c.id === id)
    if (!item) return
    await updateDoc(
      doc(db, collectionFor(item), id),
      sanitizeForFirestore({ status, updatedAt: serverTimestamp() })
    )
    audit({
      actionType: status === 'active' ? 'approve' : 'update',
      action: `Set charity cause status to ${status}: ${item?.title || id}`,
      entityType: 'beneficiary',
      entityId: id,
      entityName: item?.title,
      status: 'success',
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this cause?')) return
    const item = cases.find((c) => c.id === id)
    if (!item) return
    await deleteDoc(doc(db, collectionFor(item), id))
    audit({
      actionType: 'delete',
      action: `Deleted charity cause: ${item?.title || id}`,
      entityType: 'beneficiary',
      entityId: id,
      entityName: item?.title,
      status: 'success',
    })
  }

  const filteredCases = cases.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'active') return c.status === 'active'
    if (filter === 'draft') return c.status === 'draft'
    if (filter === 'archived') return c.status === 'archived' || c.status === 'completed'
    return true
  })

  const activeCount = cases.filter((c) => c.status === 'active').length
  const legacyCount = cases.filter((c) => c.sourceCollection === 'causes').length

  const inputClass =
    'w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:border-neutral-900'
  const btnPrimary =
    'min-h-[44px] bg-black hover:bg-neutral-900 text-white px-4 py-2 rounded text-sm font-semibold'
  const btnSecondary =
    'min-h-[44px] bg-black hover:bg-neutral-900 text-white px-4 py-2 rounded text-sm font-semibold'
  const btnDanger =
    'min-h-[44px] bg-black hover:bg-neutral-900 text-white px-3 py-2 rounded text-sm font-semibold'
  const rowBtn = BUTTON_ROW_COMPACT

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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2
                className="text-lg"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                All Causes
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {cases.length} total · {activeCount} active
                {legacyCount > 0 ? ` · ${legacyCount} from legacy list` : ''}
              </p>
            </div>
            {legacyCount > 0 && (
              <button
                type="button"
                disabled={importing}
                onClick={() => void importLegacyCauses()}
                className={`${btnSecondary} inline-flex items-center gap-2 disabled:opacity-50`}
              >
                <RefreshCw className={`w-4 h-4 ${importing ? 'animate-spin' : ''}`} />
                {importing ? 'Importing…' : 'Import legacy into Charity Cases'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {(['all', 'active', 'draft', 'archived'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[40px] ${
                  filter === tab
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-300 text-black'
                }`}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'active'
                    ? 'Active'
                    : tab === 'draft'
                      ? 'Draft'
                      : 'Archived'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-neutral-100 rounded" />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <HeartHandshake className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600 mb-1">
                {cases.length === 0 ? 'No charity cases yet' : 'No causes in this filter'}
              </p>
              <p className="text-sm text-neutral-500">
                Create a cause above and set status to Active to publish on /donate.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-4">
                {filteredCases.map((c) => {
                  const pct = progressPercent(c.amountRaised, c.targetAmount)
                  return (
                    <div key={`${c.sourceCollection}-${c.id}`} className="border border-neutral-200 rounded-lg p-4 space-y-3">
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
                            {c.sourceCollection === 'causes' ? ' · legacy' : ''}
                          </p>
                          <p className="text-xs text-neutral-600 mt-1">
                            AED {c.amountRaised.toLocaleString()} / {c.targetAmount.toLocaleString()} (
                            {pct}%)
                          </p>
                        </div>
                      </div>
                      <div className={ACTION_ROW}>
                        <button type="button" className={rowBtn} onClick={() => setEditing(c)}>
                          Edit
                        </button>
                        {c.status !== 'active' && c.status !== 'archived' && (
                          <button
                            type="button"
                            className={rowBtn}
                            onClick={() => setStatus(c.id, 'active')}
                          >
                            Publish
                          </button>
                        )}
                        {c.status === 'active' && (
                          <button
                            type="button"
                            className={rowBtn}
                            onClick={() => setStatus(c.id, 'archived')}
                          >
                            <Archive className="w-3.5 h-3.5" />
                            Archive
                          </button>
                        )}
                        {c.status === 'archived' && (
                          <button
                            type="button"
                            className={rowBtn}
                            onClick={() => setStatus(c.id, 'draft')}
                          >
                            Restore
                          </button>
                        )}
                        <button type="button" className={rowBtn} onClick={() => handleDelete(c.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block admin-table-scroll -mx-1 min-w-0">
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
                    {filteredCases.map((c) => {
                      const pct = progressPercent(c.amountRaised, c.targetAmount)
                      const created =
                        (c.createdAt as { toDate?: () => Date })?.toDate?.() || null
                      return (
                        <tr key={`${c.sourceCollection}-${c.id}`} className="border-b border-neutral-100 align-top">
                          <td className="py-3 pr-3">
                            <div className="flex gap-2 items-center">
                              {c.bannerImage ? (
                                <img
                                  src={c.bannerImage}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : null}
                              <div>
                                <span className="font-medium">{c.title}</span>
                                {c.sourceCollection === 'causes' ? (
                                  <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                    Legacy
                                  </span>
                                ) : null}
                              </div>
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
                          <td className="py-3 whitespace-nowrap">
                            <div className={ACTION_ROW}>
                              <button
                                type="button"
                                className={rowBtn}
                                onClick={() => setEditing(c)}
                              >
                                Edit
                              </button>
                              {c.status !== 'active' && c.status !== 'archived' && (
                                <button
                                  type="button"
                                  className={rowBtn}
                                  onClick={() => setStatus(c.id, 'active')}
                                >
                                  Publish
                                </button>
                              )}
                              {c.status === 'active' && (
                                <button
                                  type="button"
                                  className={rowBtn}
                                  onClick={() => setStatus(c.id, 'archived')}
                                >
                                  Archive
                                </button>
                              )}
                              {c.status === 'archived' && (
                                <button
                                  type="button"
                                  className={rowBtn}
                                  onClick={() => setStatus(c.id, 'draft')}
                                >
                                  Restore
                                </button>
                              )}
                              <button
                                type="button"
                                className={rowBtn}
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
