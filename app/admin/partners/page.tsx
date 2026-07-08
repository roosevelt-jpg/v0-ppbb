'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Upload,
  Sparkles,
} from 'lucide-react'
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
import {
  DEFAULT_PARTNER_NAMES,
  Partner,
  PartnerType,
  subscribeToAllPartners,
} from '@/lib/partners'
import { useAuth } from '@/lib/auth-context'
import { uploadImageToFirebase } from '@/lib/upload-utils'

const PARTNER_TYPES: PartnerType[] = [
  'sponsor',
  'partner',
  'charity',
  'government',
  'corporate',
  'grassroots',
]

export default function AdminPartnersLogosPage() {
  const { user } = useAuth()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    logoURL: '',
    websiteURL: '',
    type: 'partner' as PartnerType,
    order: 0,
    isActive: true,
  })

  useEffect(() => subscribeToAllPartners(setPartners), [])
  useEffect(() => {
    if (partners.length >= 0) setLoading(false)
  }, [partners])

  const showMessage = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true)
      const url = await uploadImageToFirebase(file, 'partners/logos', {
        preset: 'logo',
        allowSvg: true,
      })
      setForm((prev) => ({ ...prev, logoURL: url }))
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      await addDoc(collection(db, 'partners'), {
        name: form.name.trim(),
        logoURL: form.logoURL || '',
        websiteURL: form.websiteURL.trim() || null,
        type: form.type,
        isActive: form.isActive,
        order: form.order || partners.length,
        createdAt: serverTimestamp(),
        addedBy: user?.id || 'admin',
      })
      setForm({
        name: '',
        logoURL: '',
        websiteURL: '',
        type: 'partner',
        order: partners.length + 1,
        isActive: true,
      })
      showMessage('success', 'Partner added.')
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to add partner')
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
        await addDoc(collection(db, 'partners'), {
          name,
          logoURL: '',
          websiteURL: null,
          type: 'partner',
          isActive: true,
          order: order++,
          createdAt: serverTimestamp(),
          addedBy: user?.id || 'admin',
        })
        added++
      }
      showMessage('success', added > 0 ? `Seeded ${added} partner names.` : 'All default partners already exist.')
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const toggleActive = async (partner: Partner) => {
    await updateDoc(doc(db, 'partners', partner.id), { isActive: !partner.isActive })
  }

  const movePartner = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= partners.length) return
    const a = partners[index]
    const b = partners[target]
    await Promise.all([
      updateDoc(doc(db, 'partners', a.id), { order: b.order }),
      updateDoc(doc(db, 'partners', b.id), { order: a.order }),
    ])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner?')) return
    await deleteDoc(doc(db, 'partners', id))
  }

  return (
    <AdminPageLayout title="Partners & Logos">
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold text-neutral-900">Partners &amp; Logos</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage logos for the homepage marquee and Partners page. Changes sync live via Firestore.
          </p>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="bg-white text-black border border-gray-300 hover:bg-gray-50 shadow-none min-h-0"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {seeding ? 'Seeding…' : 'Seed default partner names'}
          </Button>
        </div>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Add partner</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as PartnerType }))}
                className="w-full"
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website URL</label>
              <input
                type="url"
                value={form.websiteURL}
                onChange={(e) => setForm((p) => ({ ...p, websiteURL: e.target.value }))}
                className="w-full"
                placeholder="https://"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Logo (PNG, SVG, WebP)</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading…' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/png,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  />
                </label>
                {form.logoURL && (
                  <img src={form.logoURL} alt="" className="h-10 w-auto object-contain border rounded p-1" />
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Add partner
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-4 sm:p-6 overflow-x-auto">
          <h2 className="font-headline text-xl font-bold mb-4">All partners</h2>
          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : partners.length === 0 ? (
            <p className="text-sm text-neutral-500">No partners yet. Seed defaults or add one above.</p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-neutral-500">
                  <th className="py-2 pr-4">Logo</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Active</th>
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner, index) => (
                  <tr key={partner.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4">
                      {partner.logoURL ? (
                        <img src={partner.logoURL} alt="" className="h-10 w-10 object-contain" />
                      ) : (
                        <span className="text-xs text-neutral-400">Text only</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-medium">{partner.name}</td>
                    <td className="py-3 pr-4 capitalize">{partner.type}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(partner)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          partner.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {partner.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3 pr-4">{partner.order}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => movePartner(index, 'up')}
                          disabled={index === 0}
                          className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none"
                          aria-label="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePartner(index, 'down')}
                          disabled={index === partners.length - 1}
                          className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none"
                          aria-label="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(partner.id)}
                          className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 bg-red-600 text-white rounded shadow-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AdminPageLayout>
  )
}
