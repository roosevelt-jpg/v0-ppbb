'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { formatRecordPhoneDisplay } from '@/lib/user-profile'
import { AdminUserProfileModal, AdminViewProfileButton } from '@/components/admin-user-profile-modal'
import { profileFromSponsor } from '@/lib/admin-profile-view'
import type { AdminProfileViewData } from '@/lib/admin-profile-view'
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Handshake,
  Store,
} from 'lucide-react'

export const SPONSOR_TYPES = [
  'Gold Sponsor',
  'Community Partner',
  'Charity Sponsor',
  'Event Partner',
  'Vendor',
  'Volunteer Sponsor',
  'Strategic Partner',
] as const

export type SponsorType = (typeof SPONSOR_TYPES)[number]

type CrmRow = {
  id: string
  source: 'sponsors' | 'businesses'
  name: string
  type: string
  logoURL: string
  contribution: string
  campaign: string
  status: string
  isRecurring: boolean
  email?: string
  phone?: string
  websiteURL?: string
  eventId?: string
  raw: Record<string, unknown>
}

type FormState = {
  name: string
  logoURL: string
  type: SponsorType
  contribution: string
  campaign: string
  status: 'active' | 'inactive'
  isRecurring: boolean
  email: string
  websiteURL: string
  eventId: string
}

const emptyForm = (): FormState => ({
  name: '',
  logoURL: '',
  type: 'Community Partner',
  contribution: '',
  campaign: '',
  status: 'active',
  isRecurring: false,
  email: '',
  websiteURL: '',
  eventId: '',
})

function mapLegacyLevel(level: unknown): string {
  const l = String(level || '').toLowerCase()
  if (l === 'gold') return 'Gold Sponsor'
  if (l === 'silver' || l === 'bronze' || l === 'standard') return 'Community Partner'
  return ''
}

function normalizeSponsorDoc(id: string, data: Record<string, unknown>): CrmRow {
  const type =
    (typeof data.sponsorType === 'string' && data.sponsorType) ||
    mapLegacyLevel(data.sponsorshipLevel) ||
    (typeof data.type === 'string' && data.type) ||
    'Community Partner'
  const contribution =
    typeof data.contribution === 'string'
      ? data.contribution
      : typeof data.contributionAmount === 'number'
        ? `AED ${data.contributionAmount}`
        : typeof data.amount === 'number'
          ? `AED ${data.amount}`
          : ''
  return {
    id,
    source: 'sponsors',
    name: String(data.name || 'Sponsor'),
    type,
    logoURL: String(data.logoURL || data.logoUrl || ''),
    contribution,
    campaign: String(data.campaign || data.campaignName || ''),
    status: String(data.status || 'active'),
    isRecurring: data.isRecurring === true,
    email: typeof data.email === 'string' ? data.email : undefined,
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    websiteURL: typeof data.websiteURL === 'string' ? data.websiteURL : undefined,
    eventId: typeof data.eventId === 'string' ? data.eventId : undefined,
    raw: data,
  }
}

function normalizeBusinessSponsor(id: string, data: Record<string, unknown>): CrmRow {
  return {
    id,
    source: 'businesses',
    name: String(data.name || data.businessName || 'Business'),
    type:
      (typeof data.sponsorType === 'string' && data.sponsorType) ||
      'Strategic Partner',
    logoURL: String(data.logoURL || data.logoUrl || data.imageURL || ''),
    contribution: String(data.sponsorContribution || data.contribution || ''),
    campaign: String(data.sponsorCampaign || data.campaign || ''),
    status: data.isActive === false ? 'inactive' : 'active',
    isRecurring: data.isRecurringSponsor === true || data.isRecurring === true,
    email: typeof data.email === 'string' ? data.email : undefined,
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    websiteURL: typeof data.website === 'string' ? data.website : undefined,
    eventId: typeof data.sponsorEventId === 'string' ? data.sponsorEventId : undefined,
    raw: data,
  }
}

function downloadCsv(rows: CrmRow[]) {
  const header = [
    'Name',
    'Source',
    'Type',
    'Contribution',
    'Campaign',
    'Status',
    'Recurring',
    'Email',
    'Website',
  ]
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.name,
        r.source,
        r.type,
        r.contribution,
        r.campaign,
        r.status,
        r.isRecurring ? 'yes' : 'no',
        r.email || '',
        r.websiteURL || '',
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sponsors-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Part 13B — Sponsor CRM at existing /admin/sponsors.
 * Merges sponsors/ (external) + businesses where isSponsor == true.
 */
export default function SponsorsCrmPage() {
  const [sponsorRows, setSponsorRows] = React.useState<CrmRow[]>([])
  const [businessRows, setBusinessRows] = React.useState<CrmRow[]>([])
  const [events, setEvents] = React.useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CrmRow | null>(null)
  const [form, setForm] = React.useState<FormState>(emptyForm())
  const [uploading, setUploading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [flagBusinessId, setFlagBusinessId] = React.useState('')
  const [businessOptions, setBusinessOptions] = React.useState<
    { id: string; name: string; isSponsor?: boolean }[]
  >([])
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [activeProfile, setActiveProfile] = React.useState<AdminProfileViewData | null>(null)
  const [profileEditRow, setProfileEditRow] = React.useState<CrmRow | null>(null)

  const openProfile = (row: CrmRow) => {
    setActiveProfile(profileFromSponsor(row as unknown as Record<string, unknown>))
    setProfileEditRow(row)
    setProfileOpen(true)
  }

  React.useEffect(() => {
    const unsubS = onSnapshot(collection(db, 'sponsors'), (snap) => {
      setSponsorRows(
        snap.docs.map((d) => normalizeSponsorDoc(d.id, d.data() as Record<string, unknown>))
      )
      setLoading(false)
    })
    // Platform businesses marked as sponsors (isSponsor flag)
    const unsubB = onSnapshot(
      query(collection(db, 'businesses'), where('isSponsor', '==', true)),
      (snap) => {
        setBusinessRows(
          snap.docs.map((d) =>
            normalizeBusinessSponsor(d.id, d.data() as Record<string, unknown>)
          )
        )
      },
      () => setBusinessRows([])
    )
    const unsubE = onSnapshot(collection(db, 'events'), (snap) => {
      setEvents(
        snap.docs
          .map((d) => ({
            id: d.id,
            title: String((d.data() as { title?: string }).title || 'Event'),
          }))
          .slice(0, 200)
      )
    })
    // For "flag business as sponsor" helper
    const unsubAllB = onSnapshot(collection(db, 'businesses'), (snap) => {
      setBusinessOptions(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>
          return {
            id: d.id,
            name: String(data.name || data.businessName || d.id),
            isSponsor: data.isSponsor === true,
          }
        })
      )
    })
    return () => {
      unsubS()
      unsubB()
      unsubE()
      unsubAllB()
    }
  }, [])

  const merged = React.useMemo(() => {
    const all = [...sponsorRows, ...businessRows]
    const term = search.trim().toLowerCase()
    const filtered = !term
      ? all
      : all.filter((r) =>
          [r.name, r.type, r.contribution, r.campaign, r.status, r.email]
            .join(' ')
            .toLowerCase()
            .includes(term)
        )
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [sponsorRows, businessRows, search])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (row: CrmRow) => {
    setEditing(row)
    setForm({
      name: row.name,
      logoURL: row.logoURL,
      type: (SPONSOR_TYPES.includes(row.type as SponsorType)
        ? row.type
        : 'Community Partner') as SponsorType,
      contribution: row.contribution,
      campaign: row.campaign,
      status: row.status === 'inactive' ? 'inactive' : 'active',
      isRecurring: row.isRecurring,
      email: row.email || '',
      websiteURL: row.websiteURL || '',
      eventId: row.eventId || '',
    })
    setModalOpen(true)
  }

  const handleLogo = async (file: File) => {
    try {
      setUploading(true)
      const url = await uploadImageToFirebase(file, 'sponsors/logos', {
        preset: 'logo',
        allowSvg: true,
      })
      setForm((p) => ({ ...p, logoURL: url }))
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Logo upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      if (editing?.source === 'businesses') {
        await updateDoc(
          doc(db, 'businesses', editing.id),
          sanitizeForFirestore({
            isSponsor: true,
            sponsorType: form.type,
            sponsorContribution: form.contribution.trim() || null,
            sponsorCampaign: form.campaign.trim() || null,
            isRecurringSponsor: form.isRecurring,
            sponsorEventId: form.eventId || null,
            logoURL: form.logoURL || editing.logoURL || null,
            updatedAt: serverTimestamp(),
          })
        )
      } else if (editing?.source === 'sponsors') {
        await updateDoc(
          doc(db, 'sponsors', editing.id),
          sanitizeForFirestore({
            name: form.name.trim(),
            logoURL: form.logoURL || '',
            sponsorType: form.type,
            contribution: form.contribution.trim() || null,
            campaign: form.campaign.trim() || null,
            status: form.status,
            isRecurring: form.isRecurring,
            email: form.email.trim() || null,
            websiteURL: form.websiteURL.trim() || null,
            eventId: form.eventId || null,
            updatedAt: serverTimestamp(),
          })
        )
      } else {
        await addDoc(
          collection(db, 'sponsors'),
          sanitizeForFirestore({
            name: form.name.trim(),
            logoURL: form.logoURL || '',
            sponsorType: form.type,
            contribution: form.contribution.trim() || null,
            campaign: form.campaign.trim() || null,
            status: form.status,
            isRecurring: form.isRecurring,
            email: form.email.trim() || null,
            websiteURL: form.websiteURL.trim() || null,
            eventId: form.eventId || null,
            source: 'external',
            createdAt: serverTimestamp(),
          })
        )
      }
      setMessage({ type: 'success', text: editing ? 'Sponsor updated.' : 'Sponsor added.' })
      setModalOpen(false)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: CrmRow) => {
    if (row.source === 'businesses') {
      if (!confirm('Remove sponsor flag from this business? The business listing itself stays.')) {
        return
      }
      await updateDoc(
        doc(db, 'businesses', row.id),
        sanitizeForFirestore({
          isSponsor: false,
          updatedAt: serverTimestamp(),
        })
      )
      setMessage({ type: 'success', text: 'Business unmarked as sponsor.' })
      return
    }
    if (!confirm('Delete this external sponsor?')) return
    await deleteDoc(doc(db, 'sponsors', row.id))
    setMessage({ type: 'success', text: 'Sponsor deleted.' })
  }

  const flagBusinessAsSponsor = async () => {
    if (!flagBusinessId) return
    try {
      await updateDoc(
        doc(db, 'businesses', flagBusinessId),
        sanitizeForFirestore({
          isSponsor: true,
          sponsorType: 'Strategic Partner',
          updatedAt: serverTimestamp(),
        })
      )
      setMessage({ type: 'success', text: 'Business marked as platform sponsor.' })
      setFlagBusinessId('')
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to flag business',
      })
    }
  }

  return (
    <AdminPageLayout title="Sponsor CRM">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              CRM
            </p>
            <h1
              className="text-2xl sm:text-3xl text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Sponsor CRM
            </h1>
            <p className="text-sm text-neutral-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              External sponsors live in <code className="text-xs">sponsors/</code>. Platform
              businesses appear when <code className="text-xs">isSponsor = true</code> on{' '}
              <code className="text-xs">businesses/</code>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadCsv(merged)}
              className="min-h-[44px] px-4 bg-white text-black border border-neutral-300 rounded text-sm font-semibold inline-flex items-center justify-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="min-h-[44px] px-4 bg-black text-white rounded text-sm font-semibold inline-flex items-center justify-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Plus className="w-4 h-4" />
              Add Sponsor
            </button>
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
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            {message.text}
          </div>
        )}

        <div className="rounded-lg border border-[#e4e1da] bg-white p-4 space-y-3">
          <p
            className="text-xs uppercase tracking-[0.15em] text-neutral-500"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Flag platform business as sponsor
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={flagBusinessId}
              onChange={(e) => setFlagBusinessId(e.target.value)}
              className="flex-1 border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <option value="">Select a business…</option>
              {businessOptions
                .filter((b) => !b.isSponsor)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={flagBusinessAsSponsor}
              disabled={!flagBusinessId}
              className="min-h-[44px] px-4 bg-white text-black border border-neutral-300 rounded text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Store className="w-4 h-4" />
              Mark as sponsor
            </button>
          </div>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sponsors…"
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm bg-white"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-neutral-100 rounded" />
            <div className="h-20 bg-neutral-100 rounded" />
          </div>
        ) : merged.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e4e1da] bg-white p-8 sm:p-12 text-center">
            <Handshake className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
            <h2
              className="text-xl text-neutral-900 mb-1"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              No sponsors yet
            </h2>
            <p className="text-sm text-neutral-500 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Add an external sponsor or flag a platform business.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="min-h-[44px] px-5 bg-black text-white rounded text-sm font-semibold"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Add Sponsor
            </button>
          </div>
        ) : (
          <>
            <ul className="lg:hidden space-y-3">
              {merged.map((row) => (
                <li
                  key={`${row.source}-${row.id}`}
                  className="rounded-lg border border-[#e4e1da] bg-white p-4 space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="h-12 w-12 shrink-0 border rounded bg-neutral-50 flex items-center justify-center overflow-hidden">
                      {row.logoURL ? (
                        <img src={row.logoURL} alt="" className="h-12 w-12 object-contain" />
                      ) : (
                        <Handshake className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold text-neutral-900 truncate"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {row.name}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {row.type} · {row.source === 'businesses' ? 'Platform' : 'External'}
                        {row.isRecurring ? ' · Recurring' : ''}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {row.contribution || '—'} · {row.campaign || 'No campaign'} · {row.status}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {row.email || 'No email'} · Phone: {formatRecordPhoneDisplay(row.phone)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminViewProfileButton compact onClick={() => openProfile(row)} />
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="min-h-[44px] px-3 bg-white text-black border border-neutral-300 rounded text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      className="min-h-[44px] px-3 bg-red-600 text-white rounded text-xs font-semibold"
                    >
                      {row.source === 'businesses' ? 'Unflag' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden lg:block admin-table-scroll border border-[#e4e1da] rounded-lg bg-white min-w-0">
              <table
                className="w-full text-sm min-w-[1080px]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <thead>
                  <tr className="border-b text-left text-neutral-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-3">Business/Sponsor Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Logo</th>
                    <th className="py-3 px-3">Contribution</th>
                    <th className="py-3 px-3">Campaign</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merged.map((row) => (
                    <tr key={`${row.source}-${row.id}`} className="border-b border-neutral-100">
                      <td className="py-3 px-3">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-neutral-500">
                          {row.source === 'businesses' ? 'Platform business' : 'External'}
                          {row.isRecurring ? ' · Recurring' : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-600 break-all">
                        {row.email || '—'}
                      </td>
                      <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                        {formatRecordPhoneDisplay(row.phone)}
                      </td>
                      <td className="py-3 px-3">{row.type}</td>
                      <td className="py-3 px-3">
                        {row.logoURL ? (
                          <img
                            src={row.logoURL}
                            alt=""
                            className="h-12 w-12 object-contain border rounded"
                          />
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 max-w-[160px]">
                        <span className="line-clamp-2">{row.contribution || '—'}</span>
                      </td>
                      <td className="py-3 px-3 max-w-[140px]">
                        <span className="line-clamp-2">{row.campaign || '—'}</span>
                      </td>
                      <td className="py-3 px-3 capitalize">{row.status}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2">
                          <AdminViewProfileButton compact onClick={() => openProfile(row)} />
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded bg-white text-black border border-neutral-300"
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
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

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2
              className="text-2xl text-neutral-900 mb-4 pr-10"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {editing ? 'Edit Sponsor' : 'Add Sponsor'}
            </h2>
            {editing?.source === 'businesses' ? (
              <p className="text-xs text-neutral-500 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Editing platform business sponsor fields (isSponsor remains true).
              </p>
            ) : null}
            <form
              onSubmit={handleSave}
              className="space-y-4"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  disabled={editing?.source === 'businesses'}
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm disabled:bg-neutral-50"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Logo
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border border-neutral-300 rounded cursor-pointer text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading…' : 'Upload logo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])}
                    />
                  </label>
                  {form.logoURL ? (
                    <img
                      src={form.logoURL}
                      alt=""
                      className="h-12 w-12 object-contain border rounded"
                    />
                  ) : null}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Sponsor type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, type: e.target.value as SponsorType }))
                  }
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                >
                  {SPONSOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Contribution
                </label>
                <input
                  type="text"
                  value={form.contribution}
                  onChange={(e) => setForm((p) => ({ ...p, contribution: e.target.value }))}
                  placeholder="e.g. AED 5,000 or in-kind catering"
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Campaign
                </label>
                <input
                  type="text"
                  value={form.campaign}
                  onChange={(e) => setForm((p) => ({ ...p, campaign: e.target.value }))}
                  placeholder="Campaign or programme name"
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  Linked event (optional)
                </label>
                <select
                  value={form.eventId}
                  onChange={(e) => setForm((p) => ({ ...p, eventId: e.target.value }))}
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                >
                  <option value="">None</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
              {editing?.source !== 'businesses' ? (
                <>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={form.websiteURL}
                      onChange={(e) => setForm((p) => ({ ...p, websiteURL: e.target.value }))}
                      className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          status: e.target.value as 'active' | 'inactive',
                        }))
                      }
                      className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </>
              ) : null}
              <label className="inline-flex items-center gap-3 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm((p) => ({ ...p, isRecurring: e.target.checked }))}
                  className="h-5 w-5"
                />
                <span className="text-sm font-medium">Recurring sponsor</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="min-h-[44px] px-5 bg-black text-white rounded text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] px-5 bg-white text-black border border-neutral-300 rounded text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminUserProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={activeProfile}
        onEdit={profileEditRow ? () => openEdit(profileEditRow) : undefined}
        editLabel={activeProfile?.editHref ? 'Edit business' : 'Edit sponsor'}
      />
    </AdminPageLayout>
  )
}
