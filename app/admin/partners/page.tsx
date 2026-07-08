'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Trash2,
  Pencil,
  X,
  AlertCircle,
  CheckCircle2,
  Upload,
  Sparkles,
  GripVertical,
} from 'lucide-react'
import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import {
  DEFAULT_PARTNER_NAMES,
  Partner,
  PartnerType,
  subscribeToAllPartners,
} from '@/lib/partners'
import { useAuth } from '@/lib/auth-context'
import { uploadFileToFirebase } from '@/lib/upload-utils'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { useAdminAudit } from '@/lib/use-admin-audit'

const PARTNER_TYPES: { value: PartnerType; label: string }[] = [
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'partner', label: 'Partner' },
  { value: 'charity', label: 'Charity' },
  { value: 'government', label: 'Government' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'grassroots', label: 'Grassroots' },
]

type PartnerFormState = {
  name: string
  logoURL: string
  websiteURL: string
  type: PartnerType
  order: number
  isActive: boolean
}

const emptyForm = (order = 0): PartnerFormState => ({
  name: '',
  logoURL: '',
  websiteURL: '',
  type: 'partner',
  order,
  isActive: true,
})

function extFromFile(file: File): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : ''
  if (fromName && /^[a-z0-9]+$/i.test(fromName)) return fromName.toLowerCase()
  if (file.type === 'image/svg+xml') return 'svg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/jpeg') return 'jpg'
  return 'png'
}

export default function AdminPartnersLogosPage() {
  const { user } = useAuth()
  const audit = useAdminAudit()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PartnerFormState>(emptyForm())
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => subscribeToAllPartners(setPartners), [])
  useEffect(() => {
    setLoading(false)
  }, [partners])

  const showMessage = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm(partners.length))
    setPendingLogoFile(null)
    setModalOpen(true)
  }

  const openEdit = (partner: Partner) => {
    setEditingId(partner.id)
    setForm({
      name: partner.name,
      logoURL: partner.logoURL || '',
      websiteURL: partner.websiteURL || '',
      type: partner.type,
      order: partner.order,
      isActive: partner.isActive,
    })
    setPendingLogoFile(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setPendingLogoFile(null)
  }

  const handleLogoPick = (file: File) => {
    setPendingLogoFile(file)
    // Local preview only until save
    const preview = URL.createObjectURL(file)
    setForm((prev) => ({ ...prev, logoURL: preview }))
  }

  const uploadLogoForId = async (partnerId: string, file: File): Promise<string> => {
    const ext = extFromFile(file)
    const exactPath = `partners/${partnerId}/logo.${ext}`
    return uploadFileToFirebase(file, `partners/${partnerId}`, exactPath)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (!editingId && !form.logoURL && !pendingLogoFile) {
      showMessage('error', 'Logo upload is required for new partners.')
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      if (editingId) {
        let logoURL = form.logoURL.startsWith('blob:') ? '' : form.logoURL
        if (pendingLogoFile) {
          setUploading(true)
          logoURL = await uploadLogoForId(editingId, pendingLogoFile)
          setUploading(false)
        }
        await updateDoc(
          doc(db, 'partners', editingId),
          sanitizeForFirestore({
            name: form.name.trim(),
            logoURL: logoURL || '',
            websiteURL: form.websiteURL.trim() || null,
            type: form.type,
            isActive: form.isActive,
            order: form.order,
            updatedAt: serverTimestamp(),
          })
        )
        audit({
          actionType: 'update',
          action: `Updated partner: ${form.name}`,
          entityType: 'content',
          entityId: editingId,
          entityName: form.name,
          status: 'success',
        })
        showMessage('success', 'Partner updated.')
      } else {
        const ref = await addDoc(
          collection(db, 'partners'),
          sanitizeForFirestore({
            name: form.name.trim(),
            logoURL: '',
            websiteURL: form.websiteURL.trim() || null,
            type: form.type,
            isActive: form.isActive,
            order: form.order || partners.length,
            createdAt: serverTimestamp(),
            addedBy: user?.id || 'admin',
          })
        )
        if (pendingLogoFile) {
          setUploading(true)
          const logoURL = await uploadLogoForId(ref.id, pendingLogoFile)
          setUploading(false)
          await updateDoc(doc(db, 'partners', ref.id), sanitizeForFirestore({ logoURL }))
        }
        audit({
          actionType: 'create',
          action: `Created partner: ${form.name}`,
          entityType: 'content',
          entityId: ref.id,
          entityName: form.name,
          status: 'success',
        })
        showMessage('success', 'Partner added.')
      }
      closeModal()
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to save partner')
    } finally {
      setUploading(false)
      setSaving(false)
    }
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    setMessage(null)
    try {
      const existing = new Set(partners.map((p) => p.name.toLowerCase()))
      let order = partners.length
      let added = 0
      for (const name of DEFAULT_PARTNER_NAMES) {
        if (existing.has(name.toLowerCase())) continue
        await addDoc(
          collection(db, 'partners'),
          sanitizeForFirestore({
            name,
            logoURL: '',
            websiteURL: null,
            type: 'partner' as PartnerType,
            isActive: true,
            order: order++,
            createdAt: serverTimestamp(),
            addedBy: user?.id || 'admin',
          })
        )
        added++
      }
      if (added > 0) {
        audit({
          actionType: 'create',
          action: `Seeded ${added} default partner(s)`,
          entityType: 'content',
          status: 'success',
        })
      }
      showMessage(
        'success',
        added > 0 ? `Seeded ${added} partner names.` : 'All default partners already exist.'
      )
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const toggleActive = async (partner: Partner) => {
    await updateDoc(doc(db, 'partners', partner.id), { isActive: !partner.isActive })
    audit({
      actionType: 'update',
      action: `${partner.isActive ? 'Deactivated' : 'Activated'} partner: ${partner.name}`,
      entityType: 'content',
      entityId: partner.id,
      entityName: partner.name,
      status: 'success',
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner?')) return
    const partner = partners.find((p) => p.id === id)
    await deleteDoc(doc(db, 'partners', id))
    audit({
      actionType: 'delete',
      action: `Deleted partner: ${partner?.name || id}`,
      entityType: 'content',
      entityId: id,
      entityName: partner?.name,
      status: 'success',
    })
  }

  const persistOrder = async (ordered: Partner[]) => {
    const batch = writeBatch(db)
    ordered.forEach((p, index) => {
      batch.update(doc(db, 'partners', p.id), { order: index })
    })
    await batch.commit()
    audit({
      actionType: 'update',
      action: `Reordered ${ordered.length} partner(s)`,
      entityType: 'content',
      status: 'success',
    })
  }

  const onDragStart = (index: number) => setDragIndex(index)

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const onDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const next = [...partners]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setPartners(next.map((p, i) => ({ ...p, order: i })))
    setDragIndex(null)
    setDragOverIndex(null)
    try {
      await persistOrder(next)
      showMessage('success', 'Order saved.')
    } catch {
      showMessage('error', 'Failed to save order')
    }
  }

  const typeLabel = (t: PartnerType) =>
    PARTNER_TYPES.find((x) => x.value === t)?.label || t

  return (
    <AdminPageLayout title="Partners & Logos">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              CMS
            </p>
            <h1
              className="text-2xl sm:text-3xl text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Partners &amp; Logos
            </h1>
            <p
              className="text-sm text-neutral-600 mt-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Manage logos that appear in the homepage marquee and Partners page
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              type="button"
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="bg-white text-black border border-neutral-300 hover:bg-neutral-50 min-h-[44px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {seeding ? 'Seeding…' : 'Seed defaults'}
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              className="bg-black text-white hover:bg-neutral-900 min-h-[44px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </div>
        </div>

        {message && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-neutral-100 rounded" />
            <div className="h-16 bg-neutral-100 rounded" />
            <div className="h-16 bg-neutral-100 rounded" />
          </div>
        ) : partners.length === 0 ? (
          <p className="text-sm text-neutral-500" style={{ fontFamily: 'Inter, sans-serif' }}>
            No partners yet. Seed defaults or add one.
          </p>
        ) : (
          <>
            {/* Mobile / tablet stacked cards */}
            <ul className="lg:hidden space-y-3">
              {partners.map((partner, index) => (
                <li
                  key={partner.id}
                  draggable
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={() => onDrop(index)}
                  className={`border border-[#e4e1da] rounded-lg bg-white p-4 space-y-3 ${
                    dragOverIndex === index ? 'ring-2 ring-black' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="mt-1 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-neutral-400 cursor-grab"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="w-5 h-5" />
                    </button>
                    <div className="h-12 w-12 shrink-0 border rounded flex items-center justify-center bg-neutral-50 overflow-hidden">
                      {partner.logoURL ? (
                        <img
                          src={partner.logoURL}
                          alt=""
                          className="h-12 w-12 object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-neutral-400 px-1 text-center">No logo</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold text-neutral-900 truncate"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {partner.name}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {typeLabel(partner.type)} · Order {partner.order}
                      </p>
                      {partner.websiteURL ? (
                        <a
                          href={partner.websiteURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-600 underline break-all"
                        >
                          {partner.websiteURL}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(partner)}
                      className={`min-h-[44px] px-3 rounded text-xs font-semibold ${
                        partner.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {partner.isActive ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(partner)}
                      className="min-h-[44px] px-3 rounded bg-white text-black border border-neutral-300 text-xs font-semibold"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(partner.id)}
                      className="min-h-[44px] px-3 rounded bg-red-600 text-white text-xs font-semibold"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden lg:block admin-table-scroll border border-[#e4e1da] rounded-lg bg-white min-w-0">
              <table className="w-full text-sm min-w-[960px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr className="border-b text-left text-neutral-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-3 w-10" />
                    <th className="py-3 px-3">Logo</th>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Website</th>
                    <th className="py-3 px-3">Active</th>
                    <th className="py-3 px-3">Order</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner, index) => (
                    <tr
                      key={partner.id}
                      draggable
                      onDragStart={() => onDragStart(index)}
                      onDragOver={(e) => onDragOver(e, index)}
                      onDrop={() => onDrop(index)}
                      className={`border-b border-neutral-100 ${
                        dragOverIndex === index ? 'bg-neutral-50' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-neutral-400 cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </td>
                      <td className="py-3 px-3">
                        {partner.logoURL ? (
                          <img
                            src={partner.logoURL}
                            alt=""
                            className="h-12 w-12 object-contain border rounded p-0.5"
                          />
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-neutral-900">{partner.name}</td>
                      <td className="py-3 px-3">{typeLabel(partner.type)}</td>
                      <td className="py-3 px-3 max-w-[180px]">
                        {partner.websiteURL ? (
                          <a
                            href={partner.websiteURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-600 underline truncate block"
                          >
                            {partner.websiteURL.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(partner)}
                          className={`min-h-[44px] px-3 rounded text-xs font-semibold ${
                            partner.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {partner.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="py-3 px-3">{partner.order}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(partner)}
                            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded bg-white text-black border border-neutral-300"
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(partner.id)}
                            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded bg-red-600 text-white"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-3 right-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-neutral-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2
              id="partner-modal-title"
              className="text-2xl text-neutral-900 mb-4 pr-10"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {editingId ? 'Edit Partner' : 'Add Partner'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Partner Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Logo upload {editingId ? '' : '*'}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border border-neutral-300 rounded cursor-pointer hover:bg-neutral-50 bg-white text-black text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading…' : 'Choose logo'}
                    <input
                      type="file"
                      accept="image/png,image/webp,image/svg+xml,image/jpeg"
                      className="hidden"
                      disabled={uploading || saving}
                      onChange={(e) => e.target.files?.[0] && handleLogoPick(e.target.files[0])}
                    />
                  </label>
                  {form.logoURL ? (
                    <img
                      src={form.logoURL}
                      alt=""
                      className="h-12 w-12 object-contain border rounded p-1"
                    />
                  ) : null}
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Stored at partners/&#123;id&#125;/logo.ext in Firebase Storage
                </p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Partner type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, type: e.target.value as PartnerType }))
                  }
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                >
                  {PARTNER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Website URL (optional)
                </label>
                <input
                  type="url"
                  value={form.websiteURL}
                  onChange={(e) => setForm((p) => ({ ...p, websiteURL: e.target.value }))}
                  placeholder="https://"
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-3 min-h-[44px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                      className="h-5 w-5"
                    />
                    <span className="text-sm font-medium">Active (show in marquee/grid)</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="min-h-[44px] px-5 bg-black text-white rounded text-sm font-semibold hover:bg-neutral-900 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add Partner'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[44px] px-5 bg-white text-black border border-neutral-300 rounded text-sm font-semibold"
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
