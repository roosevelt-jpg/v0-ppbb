'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { adminApiFetch } from '@/lib/admin-api-client'
import { CertificateDesignPreview } from '@/components/certificate-design-preview'
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  interpolateCertificateText,
  subscribeToCertificateTemplates,
  type CertificateSignatory,
  type CertificateTemplate,
} from '@/lib/certificate-templates'

const emptySignatory = (): CertificateSignatory => ({ name: '', title: '', signatureURL: '' })

export default function AdminCmsCertificatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<CertificateTemplate, 'id'>>(DEFAULT_CERTIFICATE_TEMPLATE)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [evaluating, setEvaluating] = useState(false)

  useEffect(() => subscribeToCertificateTemplates(setTemplates), [])

  const selected = templates.find((t) => t.id === selectedId)

  useEffect(() => {
    if (selected) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = selected
      setForm({
        ...rest,
        signatories: rest.signatories.length ? rest.signatories : [emptySignatory()],
      })
    }
  }, [selected])

  const previewData = useMemo(
    () => ({
      title: form.title,
      subtitle: form.subtitle,
      bodyText: interpolateCertificateText(form.bodyText, {
        memberName: 'Sample Member',
        hours: form.hoursRequired,
        hoursRequired: form.hoursRequired,
        title: form.title,
      }),
      memberName: 'Sample Member',
      hours: form.hoursRequired,
      credentialId: 'PB-2026-PREVIEW',
      accentColor: form.accentColor,
      logoURL: form.logoURL,
      signatories: form.signatories,
    }),
    [form]
  )

  const showMsg = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  const handleNew = () => {
    setSelectedId(null)
    setForm({
      ...DEFAULT_CERTIFICATE_TEMPLATE,
      signatories: [{ name: 'Founder Name', title: 'Founder', signatureURL: '' }],
      sortOrder: templates.length,
    })
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      showMsg('error', 'Title is required.')
      return
    }
    if (form.hoursRequired <= 0) {
      showMsg('error', 'Hours required must be greater than 0.')
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        ...form,
        signatories: form.signatories.filter((s) => s.name.trim()),
        updatedAt: serverTimestamp(),
      }

      if (selectedId) {
        await updateDoc(doc(db, 'certificateTemplates', selectedId), payload)
        showMsg('success', 'Certificate template updated.')
      } else {
        const ref = await addDoc(collection(db, 'certificateTemplates'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
        setSelectedId(ref.id)
        showMsg('success', 'Certificate template created.')
      }
    } catch (error: unknown) {
      showMsg('error', error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this certificate template? Already-issued member certificates are kept.')) return
    try {
      await deleteDoc(doc(db, 'certificateTemplates', id))
      if (selectedId === id) {
        setSelectedId(null)
        handleNew()
      }
      showMsg('success', 'Template deleted.')
    } catch {
      showMsg('error', 'Failed to delete template')
    }
  }

  const uploadSignature = async (index: number, file: File) => {
    setUploading(`sig-${index}`)
    try {
      const url = await uploadImageToFirebase(file, 'certificates/signatures', { preset: 'content' })
      setForm((prev) => {
        const signatories = [...prev.signatories]
        signatories[index] = { ...signatories[index], signatureURL: url }
        return { ...prev, signatories }
      })
    } catch (error: unknown) {
      showMsg('error', error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  const uploadLogo = async (file: File) => {
    setUploading('logo')
    try {
      const url = await uploadImageToFirebase(file, 'certificates/logos', { preset: 'content' })
      setForm((prev) => ({ ...prev, logoURL: url }))
    } catch (error: unknown) {
      showMsg('error', error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  const runEvaluateAll = async () => {
    setEvaluating(true)
    try {
      const json = await adminApiFetch<{ membersChecked: number; certificatesIssued: number }>(
        '/api/admin/certificates/evaluate-all',
        { method: 'POST' }
      )
      if (!json.success) throw new Error(json.error)
      showMsg(
        'success',
        `Checked ${json.data?.membersChecked ?? 0} members — issued ${json.data?.certificatesIssued ?? 0} new certificate(s).`
      )
    } catch (error: unknown) {
      showMsg('error', error instanceof Error ? error.message : 'Evaluation failed')
    } finally {
      setEvaluating(false)
    }
  }

  const updateSignatory = (index: number, patch: Partial<CertificateSignatory>) => {
    setForm((prev) => {
      const signatories = [...prev.signatories]
      signatories[index] = { ...signatories[index], ...patch }
      return { ...prev, signatories }
    })
  }

  return (
    <AdminPageLayout
      title="Volunteer Certificates"
      subtitle="Design milestone certificates — auto-issued when members reach volunteer hour thresholds"
    >
      <div className="space-y-6">
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

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={handleNew} className="bg-black text-white hover:bg-gray-900">
            <Plus size={16} className="mr-2" />
            New template
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void runEvaluateAll()}
            disabled={evaluating}
          >
            <RefreshCw size={16} className={`mr-2 ${evaluating ? 'animate-spin' : ''}`} />
            {evaluating ? 'Checking…' : 'Award pending certificates (all members)'}
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="font-bold text-black">Templates ({templates.length})</h2>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">No templates yet. Create one for each hour milestone (e.g. 10, 50, 100 hours).</p>
            ) : (
              templates.map((t) => (
                <Card
                  key={t.id}
                  className={`p-4 border cursor-pointer transition ${
                    selectedId === t.id ? 'border-black ring-1 ring-black' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-semibold">{t.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t.hoursRequired} hours · {t.status} · {t.signatories.length} signatory(ies)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDelete(t.id)
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              ))
            )}

            <Card className="p-6 border border-gray-200 space-y-4">
              <h3 className="font-bold">{selectedId ? 'Edit template' : 'New template'}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Certificate title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hours required *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.hoursRequired}
                    onChange={(e) => setForm({ ...form, hoursRequired: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subtitle / organization line</label>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Certificate body (use {'{memberName}'}, {'{hours}'}, {'{date}'})
                </label>
                <textarea
                  value={form.bodyText}
                  onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Accent color</label>
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className="w-full h-10 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as 'active' | 'draft' })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="active">Active (auto-award)</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Logo (optional)</label>
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload size={16} />
                  {uploading === 'logo' ? 'Uploading…' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void uploadLogo(f)
                    }}
                  />
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Signatories (Founder + others)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        signatories: [...prev.signatories, emptySignatory()],
                      }))
                    }
                    className="text-sm underline"
                  >
                    Add signatory
                  </button>
                </div>
                {form.signatories.map((sig, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        placeholder="Name"
                        value={sig.name}
                        onChange={(e) => updateSignatory(idx, { name: e.target.value })}
                        className="px-3 py-2 border rounded-lg bg-white"
                      />
                      <input
                        placeholder="Title (e.g. Founder)"
                        value={sig.title}
                        onChange={(e) => updateSignatory(idx, { title: e.target.value })}
                        className="px-3 py-2 border rounded-lg bg-white"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <Upload size={14} />
                      {uploading === `sig-${idx}` ? 'Uploading…' : 'Upload signature image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void uploadSignature(idx, f)
                        }}
                      />
                    </label>
                    {sig.signatureURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sig.signatureURL} alt="" className="h-10 object-contain" />
                    ) : null}
                    {form.signatories.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            signatories: prev.signatories.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email subject</label>
                <input
                  value={form.emailSubject}
                  onChange={(e) => setForm({ ...form, emailSubject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email body (plain text, same placeholders)</label>
                <textarea
                  value={form.emailBody}
                  onChange={(e) => setForm({ ...form, emailBody: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="bg-black text-white hover:bg-gray-900 w-full sm:w-auto"
              >
                <Save size={16} className="mr-2" />
                {saving ? 'Saving…' : selectedId ? 'Update template' : 'Create template'}
              </Button>
            </Card>
          </div>

          <div className="space-y-4 xl:sticky xl:top-4 self-start">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye size={16} />
              Live preview (sample member)
            </div>
            <CertificateDesignPreview data={previewData} />
            <p className="text-xs text-gray-500">
              When a member reaches the hour threshold, this design is saved to their dashboard and a congratulatory email is sent (if Gmail SMTP is configured).
            </p>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}
