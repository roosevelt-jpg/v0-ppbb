'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { uploadImageToFirebase, validateImageFile } from '@/lib/upload-utils'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { Building2 } from 'lucide-react'

export default function CharityPartnersPage() {
  const [partners, setPartners] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingPartner, setEditingPartner] = React.useState<any>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState('')
  const [newPartner, setNewPartner] = React.useState({
    name: '',
    description: '',
    website: '',
    paymentLink: '',
    logo: '',
    isActive: true,
    status: 'active',
  })

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'charityPartners'),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        setPartners(data)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return () => unsubscribe()
  }, [])

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPartner.name.trim()) return
    setUploadError('')

    await addDoc(
      collection(db, 'charityPartners'),
      sanitizeForFirestore({
        name: newPartner.name.trim(),
        description: newPartner.description.trim(),
        website: newPartner.website || null,
        paymentLink: newPartner.paymentLink.trim(),
        logo: newPartner.logo || null,
        isActive: newPartner.isActive,
        status: newPartner.isActive ? 'active' : 'inactive',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )

    setNewPartner({
      name: '',
      description: '',
      website: '',
      paymentLink: '',
      logo: '',
      isActive: true,
      status: 'active',
    })
  }

  const handleLogoUpload = async (file: File, target: 'new' | 'edit') => {
    try {
      setUploadError('')
      setUploading(true)
      const validation = validateImageFile(file, { preset: 'logo', allowSvg: true })
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file')
        return
      }
      const url = await uploadImageToFirebase(file, 'charity-partner-logos', {
        preset: 'logo',
        allowSvg: true,
      })
      if (target === 'new') {
        setNewPartner((p) => ({ ...p, logo: url }))
      } else if (editingPartner) {
        setEditingPartner({ ...editingPartner, logo: url })
      }
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Delete this charity partner?')) return
    await deleteDoc(doc(db, 'charityPartners', id))
  }

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPartner?.id) return

    const isActive = editingPartner.isActive !== false && editingPartner.status !== 'inactive'
    await updateDoc(
      doc(db, 'charityPartners', editingPartner.id),
      sanitizeForFirestore({
        name: editingPartner.name,
        description: editingPartner.description || '',
        website: editingPartner.website || null,
        paymentLink: editingPartner.paymentLink,
        logo: editingPartner.logo || null,
        isActive,
        status: isActive ? 'active' : 'inactive',
        updatedAt: serverTimestamp(),
      })
    )
    setEditingPartner(null)
  }

  const toggleActive = async (partner: any) => {
    const next = !(partner.isActive !== false && partner.status !== 'inactive')
    await updateDoc(
      doc(db, 'charityPartners', partner.id),
      sanitizeForFirestore({
        isActive: next,
        status: next ? 'active' : 'inactive',
        updatedAt: serverTimestamp(),
      })
    )
  }

  const inputClass =
    'w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:border-neutral-900'
  const btnPrimary =
    'min-h-[44px] bg-black hover:bg-neutral-900 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50'
  const btnSecondary =
    'min-h-[44px] bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded text-sm font-semibold'
  const btnDanger =
    'min-h-[44px] bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-semibold'

  const isPartnerActive = (p: any) => p.isActive !== false && p.status !== 'inactive'

  return (
    <AdminPageLayout
      title="Charity Partners"
      subtitle="Partners whose payment links power the /donate flow"
    >
      <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-100">
          <h2 className="text-lg mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Add Charity Partner
          </h2>
          <form onSubmit={handleAddPartner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Partner name (e.g. Beit Al Khair)"
              value={newPartner.name}
              onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
              className={inputClass}
              required
            />
            <input
              type="url"
              placeholder="Website URL (optional)"
              value={newPartner.website}
              onChange={(e) => setNewPartner({ ...newPartner, website: e.target.value })}
              className={inputClass}
            />
            <input
              type="url"
              placeholder="Payment link URL *"
              value={newPartner.paymentLink}
              onChange={(e) => setNewPartner({ ...newPartner, paymentLink: e.target.value })}
              className={inputClass}
              required
            />
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                Logo
              </label>
              <input
                type="file"
                accept="image/*,.svg"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'new')}
                disabled={uploading}
                className={inputClass}
              />
              {newPartner.logo ? (
                <img src={newPartner.logo} alt="" className="mt-2 h-10 object-contain" />
              ) : null}
            </div>
            <label className="flex items-center gap-2 min-h-[44px] text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={newPartner.isActive}
                onChange={(e) => setNewPartner({ ...newPartner, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              Active (shown in donation flow)
            </label>
            <textarea
              placeholder="Description"
              value={newPartner.description}
              onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
              className={`${inputClass} md:col-span-2`}
              rows={3}
            />
            {uploadError && (
              <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {uploadError}
              </div>
            )}
            <button type="submit" disabled={uploading} className={`${btnPrimary} md:col-span-2`}>
              {uploading ? 'Uploading…' : 'Add Partner'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-100">
          <h2 className="text-lg mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Partners
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-neutral-100 rounded" />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No charity partners yet</p>
              <p className="text-sm text-neutral-500 mt-1">
                Add Beit Al Khair or other partners so /donate can redirect to payment links.
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {partners.map((p) => (
                  <div key={p.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex gap-3 items-center">
                      {p.logo ? (
                        <img src={p.logo} alt="" className="w-10 h-10 object-contain" />
                      ) : null}
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-neutral-500">
                          {isPartnerActive(p) ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-2">{p.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => setEditingPartner(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => toggleActive(p)}
                      >
                        {isPartnerActive(p) ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => handleDeletePartner(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block admin-table-scroll min-w-0">
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b">
                      <th className="py-3 pr-3">Name</th>
                      <th className="py-3 pr-3">Payment link</th>
                      <th className="py-3 pr-3">Active</th>
                      <th className="py-3 pr-3">Added</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id} className="border-b border-neutral-100">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            {p.logo ? (
                              <img src={p.logo} alt="" className="w-8 h-8 object-contain" />
                            ) : null}
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 max-w-[200px] truncate">
                          {p.paymentLink ? (
                            <a
                              href={p.paymentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Open link
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <button
                            type="button"
                            onClick={() => toggleActive(p)}
                            className={`px-2 py-1 rounded text-xs font-medium min-h-[32px] ${
                              isPartnerActive(p)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {isPartnerActive(p) ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3 pr-3 text-neutral-500">
                          {formatDistanceToNow(p.createdAt?.toDate?.() || new Date(), {
                            addSuffix: true,
                          })}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              className="underline"
                              onClick={() => setEditingPartner(p)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="underline text-red-600"
                              onClick={() => handleDeletePartner(p.id)}
                            >
                              Delete
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
      </div>

      {editingPartner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
            <h2 className="text-xl mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Edit Partner
            </h2>
            <form onSubmit={handleUpdatePartner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={editingPartner.name || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                className={inputClass}
                required
              />
              <input
                type="url"
                placeholder="Website"
                value={editingPartner.website || ''}
                onChange={(e) => setEditingPartner({ ...editingPartner, website: e.target.value })}
                className={inputClass}
              />
              <input
                type="url"
                placeholder="Payment link"
                value={editingPartner.paymentLink || ''}
                onChange={(e) =>
                  setEditingPartner({ ...editingPartner, paymentLink: e.target.value })
                }
                className={`${inputClass} md:col-span-2`}
                required
              />
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/*,.svg"
                  onChange={(e) =>
                    e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'edit')
                  }
                  className={inputClass}
                />
                {editingPartner.logo ? (
                  <img src={editingPartner.logo} alt="" className="mt-2 h-12 object-contain" />
                ) : null}
              </div>
              <label className="flex items-center gap-2 min-h-[44px] text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={isPartnerActive(editingPartner)}
                  onChange={(e) =>
                    setEditingPartner({
                      ...editingPartner,
                      isActive: e.target.checked,
                      status: e.target.checked ? 'active' : 'inactive',
                    })
                  }
                  className="w-4 h-4"
                />
                Active
              </label>
              <textarea
                value={editingPartner.description || ''}
                onChange={(e) =>
                  setEditingPartner({ ...editingPartner, description: e.target.value })
                }
                className={`${inputClass} md:col-span-2`}
                rows={2}
              />
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
                <button type="submit" className={btnPrimary}>
                  Save
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => setEditingPartner(null)}
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
