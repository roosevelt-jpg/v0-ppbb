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
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  DEFAULT_TEAM_MEMBERS,
  getTeamInitials,
  subscribeToAllTeamMembers,
  TeamMember,
} from '@/lib/team-members'
import { uploadImageToFirebase } from '@/lib/upload-utils'

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    title: '',
    photoURL: '',
    bio: '',
    email: '',
    whatsappNumber: '',
    linkedinURL: '',
    isActive: true,
  })

  useEffect(() => subscribeToAllTeamMembers(setMembers), [])
  useEffect(() => {
    setLoading(false)
  }, [members])

  const showMessage = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  const resetForm = () => {
    setEditingId(null)
    setForm({
      name: '',
      title: '',
      photoURL: '',
      bio: '',
      email: '',
      whatsappNumber: '',
      linkedinURL: '',
      isActive: true,
    })
  }

  const handlePhotoUpload = async (file: File, target: 'form' | string) => {
    setUploading(target === 'form' ? 'form' : target)
    try {
      const url = await uploadImageToFirebase(file, 'team/photos', { preset: 'content' })
      if (target === 'form') {
        setForm((prev) => ({ ...prev, photoURL: url }))
      } else {
        await updateDoc(doc(db, 'teamMembers', target), { photoURL: url })
        showMessage('success', 'Photo updated.')
      }
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.title.trim()) {
      showMessage('error', 'Name and title are required.')
      return
    }

    try {
      const payload = {
        name: form.name.trim(),
        title: form.title.trim(),
        photoURL: form.photoURL || null,
        bio: form.bio.trim() || null,
        email: form.email.trim() || null,
        whatsappNumber: form.whatsappNumber.trim() || null,
        linkedinURL: form.linkedinURL.trim() || null,
        isActive: form.isActive,
      }

      if (editingId) {
        await updateDoc(doc(db, 'teamMembers', editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        })
        showMessage('success', 'Team member updated.')
      } else {
        await addDoc(collection(db, 'teamMembers'), {
          ...payload,
          order: members.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        showMessage('success', 'Team member added.')
      }
      resetForm()
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to save')
    }
  }

  const startEdit = (member: TeamMember) => {
    setEditingId(member.id)
    setForm({
      name: member.name,
      title: member.title,
      photoURL: member.photoURL || '',
      bio: member.bio || '',
      email: member.email || '',
      whatsappNumber: member.whatsappNumber || '',
      linkedinURL: member.linkedinURL || '',
      isActive: member.isActive,
    })
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    setMessage(null)
    try {
      const existing = new Set(members.map((m) => m.name.toLowerCase()))
      let order = members.length
      let added = 0
      for (const member of DEFAULT_TEAM_MEMBERS) {
        if (existing.has(member.name.toLowerCase())) continue
        await addDoc(collection(db, 'teamMembers'), {
          ...member,
          order: order++,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        added++
      }
      showMessage(
        'success',
        added > 0 ? `Seeded ${added} team members.` : 'All default team members already exist.'
      )
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const toggleActive = async (member: TeamMember) => {
    try {
      await updateDoc(doc(db, 'teamMembers', member.id), {
        isActive: !member.isActive,
        updatedAt: serverTimestamp(),
      })
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Update failed')
    }
  }

  const removeMember = async (id: string) => {
    if (!confirm('Delete this team member?')) return
    try {
      await deleteDoc(doc(db, 'teamMembers', id))
      if (editingId === id) resetForm()
      showMessage('success', 'Team member deleted.')
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Delete failed')
    }
  }

  const moveMember = async (index: number, direction: 'up' | 'down') => {
    const swap = direction === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= members.length) return
    const a = members[index]
    const b = members[swap]
    try {
      await Promise.all([
        updateDoc(doc(db, 'teamMembers', a.id), { order: b.order }),
        updateDoc(doc(db, 'teamMembers', b.id), { order: a.order }),
      ])
    } catch (error: unknown) {
      showMessage('error', error instanceof Error ? error.message : 'Reorder failed')
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Team Members">
        <div className="flex items-center justify-center py-12">
          <p className="text-neutral-500">Loading team members…</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Team Members">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-bold text-neutral-900">Team (About)</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Manage leadership profiles shown on the About page. Section labels are edited at{' '}
              <a href="/admin/cms/about" className="underline font-medium">
                /admin/cms/about
              </a>
              .
            </p>
          </div>
          <Button
            type="button"
            onClick={() => void handleSeedDefaults()}
            disabled={seeding}
            className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {seeding ? 'Seeding…' : 'Seed 7 default members'}
          </Button>
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
          <h2 className="font-headline text-xl font-bold mb-4">
            {editingId ? 'Edit team member' : 'Add team member'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Bio (optional)</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  className="w-full min-h-20"
                  placeholder="Short paragraph shown on the About page"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp number (optional)</label>
                <input
                  type="text"
                  value={form.whatsappNumber}
                  onChange={(e) => setForm((p) => ({ ...p, whatsappNumber: e.target.value }))}
                  className="w-full"
                  placeholder="e.g. +61412345678 (used for wa.me link)"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">LinkedIn URL (optional)</label>
                <input
                  type="url"
                  value={form.linkedinURL}
                  onChange={(e) => setForm((p) => ({ ...p, linkedinURL: e.target.value }))}
                  className="w-full"
                  placeholder="https://linkedin.com/in/…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Photo</label>
                <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm min-h-[44px]">
                  <Upload className="w-4 h-4" />
                  {uploading === 'form' ? 'Uploading…' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && void handlePhotoUpload(e.target.files[0], 'form')
                    }
                  />
                </label>
                <div className="mt-2 flex items-center gap-3">
                  {form.photoURL ? (
                    <img
                      src={form.photoURL}
                      alt=""
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600">
                      {getTeamInitials(form.name || 'NA')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  Active on About page
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="bg-black text-white hover:bg-gray-800 min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />
                {editingId ? 'Save changes' : 'Add member'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-neutral-200 text-neutral-900 hover:bg-neutral-300 min-h-[44px]"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="p-4 sm:p-6 min-w-0">
          <h2 className="font-headline text-xl font-bold mb-4">All team members</h2>
          {members.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No team members yet. Seed defaults or add one above.
            </p>
          ) : (
            <div className="admin-table-scroll">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Photo</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Active</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, i) => (
                  <tr key={member.id} className="border-b">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">
                            {getTeamInitials(member.name)}
                          </div>
                        )}
                        <label className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 border rounded cursor-pointer hover:bg-neutral-50">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              void handlePhotoUpload(e.target.files[0], member.id)
                            }
                          />
                        </label>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-medium">{member.name}</td>
                    <td className="py-3 pr-3">{member.title}</td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(member)}
                        className={`px-3 py-2 rounded text-xs font-medium min-h-[44px] ${
                          member.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void moveMember(i, 'up')}
                          disabled={i === 0}
                          className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none"
                          aria-label="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void moveMember(i, 'down')}
                          disabled={i === members.length - 1}
                          className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none"
                          aria-label="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <Button
                          type="button"
                          onClick={() => startEdit(member)}
                          className="bg-neutral-200 text-neutral-900 hover:bg-neutral-300 min-h-[44px] text-xs"
                        >
                          Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => void removeMember(member.id)}
                          className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 bg-red-600 text-white rounded"
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
