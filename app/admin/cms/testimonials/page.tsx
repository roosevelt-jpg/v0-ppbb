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
} from 'lucide-react'
import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  MAX_TESTIMONIALS,
  subscribeToAllTestimonials,
  Testimonial,
  TestimonialType,
} from '@/lib/testimonials'
import { useAuth } from '@/lib/auth-context'
import { uploadFileToFirebase, uploadImageToFirebase } from '@/lib/upload-utils'
import { useAdminAudit } from '@/lib/use-admin-audit'

export default function AdminCmsTestimonialsPage() {
  const { user } = useAuth()
  const audit = useAdminAudit()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'text' as TestimonialType,
    name: '',
    role: '',
    quote: '',
    videoURL: '',
    avatarURL: '',
    isActive: true,
  })

  useEffect(() => subscribeToAllTestimonials(setTestimonials), [])

  const showMessage = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  const handleAvatarUpload = async (file: File) => {
    setUploading('avatar')
    try {
      const url = await uploadImageToFirebase(file, 'testimonials/avatars', { preset: 'content' })
      setForm((prev) => ({ ...prev, avatarURL: url }))
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Avatar upload failed')
    } finally {
      setUploading(null)
    }
  }

  const handleVideoUpload = async (file: File) => {
    setUploading('video')
    try {
      const url = await uploadFileToFirebase(file, 'testimonials/videos')
      setForm((prev) => ({ ...prev, videoURL: url, type: 'video' }))
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Video upload failed')
    } finally {
      setUploading(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showMessage('error', 'Name is required.')
      return
    }
    if (testimonials.length >= MAX_TESTIMONIALS) {
      showMessage('error', `Maximum ${MAX_TESTIMONIALS} testimonials allowed.`)
      return
    }
    if (form.type === 'text' && !form.quote.trim()) {
      showMessage('error', 'Quote is required for text testimonials.')
      return
    }
    if (form.type === 'video' && !form.videoURL) {
      showMessage('error', 'Video upload is required for video testimonials.')
      return
    }

    try {
      const ref = await addDoc(collection(db, 'testimonials'), {
        type: form.type,
        name: form.name.trim(),
        role: form.role.trim() || null,
        quote: form.quote.trim(),
        videoURL: form.type === 'video' ? form.videoURL : null,
        avatarURL: form.avatarURL || null,
        isActive: form.isActive,
        order: testimonials.length,
        createdAt: serverTimestamp(),
        addedBy: user?.id || 'admin',
      })
      audit({
        actionType: 'create',
        action: `Added testimonial: ${form.name}`,
        entityType: 'content',
        entityId: ref.id,
        entityName: form.name,
        status: 'success',
      })
      setForm({
        type: 'text',
        name: '',
        role: '',
        quote: '',
        videoURL: '',
        avatarURL: '',
        isActive: true,
      })
      showMessage('success', 'Testimonial added.')
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to add testimonial')
    }
  }

  const toggleActive = async (item: Testimonial) => {
    try {
      await updateDoc(doc(db, 'testimonials', item.id), { isActive: !item.isActive })
      audit({
        actionType: 'update',
        action: `${item.isActive ? 'Deactivated' : 'Activated'} testimonial: ${item.name}`,
        entityType: 'content',
        entityId: item.id,
        entityName: item.name,
        status: 'success',
      })
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Update failed')
    }
  }

  const removeItem = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return
    try {
      await deleteDoc(doc(db, 'testimonials', id))
      audit({
        actionType: 'delete',
        action: `Deleted testimonial: ${id}`,
        entityType: 'content',
        entityId: id,
        status: 'success',
      })
      showMessage('success', 'Testimonial deleted.')
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Delete failed')
    }
  }

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const swap = direction === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= testimonials.length) return
    const a = testimonials[index]
    const b = testimonials[swap]
    try {
      await Promise.all([
        updateDoc(doc(db, 'testimonials', a.id), { order: b.order }),
        updateDoc(doc(db, 'testimonials', b.id), { order: a.order }),
      ])
      audit({
        actionType: 'update',
        action: `Reordered testimonials: ${a.name} / ${b.name}`,
        entityType: 'content',
        status: 'success',
      })
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Reorder failed')
    }
  }

  return (
    <AdminPageLayout title="Testimonials CMS">
      <div className="space-y-6 w-full min-w-0">
        <div>
          <h1 className="font-headline text-3xl font-bold text-neutral-900">Testimonials</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage up to {MAX_TESTIMONIALS} text or video testimonials. Section heading is edited on{' '}
            <a href="/admin/cms/homepage" className="underline font-medium">
              Homepage CMS
            </a>
            .
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
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}

        <Card className="p-4 sm:p-6">
          <h2 className="font-headline text-xl font-bold mb-4">Add testimonial</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as TestimonialType }))}
                  className="w-full"
                >
                  <option value="text">Text</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role (optional)</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full"
                  placeholder="Community Member"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  Active on homepage
                </label>
              </div>
            </div>

            {form.type === 'text' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Quote</label>
                <textarea
                  value={form.quote}
                  onChange={(e) => setForm((p) => ({ ...p, quote: e.target.value }))}
                  className="w-full min-h-24"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Video</label>
                <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm">
                  <Upload className="w-4 h-4" />
                  {uploading === 'video' ? 'Uploading…' : 'Upload video'}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && void handleVideoUpload(e.target.files[0])}
                  />
                </label>
                {form.videoURL && (
                  <p className="text-xs text-green-700 mt-2 break-all">Video uploaded</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Avatar (optional)</label>
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm">
                <Upload className="w-4 h-4" />
                {uploading === 'avatar' ? 'Uploading…' : 'Upload avatar'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && void handleAvatarUpload(e.target.files[0])}
                />
              </label>
              {form.avatarURL && (
                <img src={form.avatarURL} alt="" className="mt-2 h-12 w-12 rounded-full object-cover" />
              )}
            </div>

            <Button
              type="submit"
              disabled={testimonials.length >= MAX_TESTIMONIALS}
              className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add testimonial ({testimonials.length}/{MAX_TESTIMONIALS})
            </Button>
          </form>
        </Card>

        <Card className="p-4 sm:p-6 min-w-0">
          <h2 className="font-headline text-xl font-bold mb-4">All testimonials</h2>
          {testimonials.length === 0 ? (
            <p className="text-sm text-neutral-500">No testimonials yet.</p>
          ) : (
            <div className="admin-table-scroll">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Order</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Active</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((item, i) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 pr-3">{item.order}</td>
                    <td className="py-3 pr-3 font-medium">{item.name}</td>
                    <td className="py-3 pr-3 capitalize">{item.type}</td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(item)}
                        className={`px-3 py-2 rounded text-xs font-medium min-h-[44px] min-w-[44px] ${
                          item.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void moveItem(i, 'up')}
                          disabled={i === 0}
                          className="flex items-center justify-center pb-compact-btn h-6 w-6 min-h-0 min-w-0 p-0 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none inline-flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3"
                          aria-label="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void moveItem(i, 'down')}
                          disabled={i === testimonials.length - 1}
                          className="flex items-center justify-center pb-compact-btn h-6 w-6 min-h-0 min-w-0 p-0 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none inline-flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3"
                          aria-label="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeItem(item.id)}
                          className="flex items-center justify-center pb-compact-btn h-6 w-6 min-h-0 min-w-0 p-0 bg-black text-white rounded inline-flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3"
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
          )}
        </Card>
      </div>
    </AdminPageLayout>
  )
}
