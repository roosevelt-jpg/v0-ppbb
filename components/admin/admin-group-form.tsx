'use client'

import React from 'react'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import type { GroupType } from '@/lib/community-types'
import { GENDER_RESTRICTION_OPTIONS, GROUP_TYPE_OPTIONS } from '@/lib/community-governance'

export type AdminGroupFormValues = {
  name: string
  description: string
  type: GroupType
  genderRestriction: string
  requiresApproval: boolean
  capacity: string
}

type AdminGroupFormProps = {
  communityId: string
  values: AdminGroupFormValues
  onChange: (values: AdminGroupFormValues) => void
  iconPreview: string
  onIconChange: (file: File | null, preview: string) => void
  loading: boolean
  error: string
  submitLabel: string
  onSubmit: (e: React.FormEvent) => void
  cancelHref: string
}

export function AdminGroupForm({
  communityId,
  values,
  onChange,
  iconPreview,
  onIconChange,
  loading,
  error,
  submitLabel,
  onSubmit,
  cancelHref,
}: AdminGroupFormProps) {
  const set = (patch: Partial<AdminGroupFormValues>) => onChange({ ...values, ...patch })

  const handleIconInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      onIconChange(file, (event.target?.result as string) || '')
    }
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
        <input
          type="text"
          required
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g., Prayer Circle, Book Club"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="What is this group about?"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Group Type</label>
        <select
          value={values.type}
          onChange={(e) => set({ type: e.target.value as GroupType })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          disabled={loading}
        >
          {GROUP_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} — {option.description}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Gender Restriction</label>
        <div className="space-y-2">
          {GENDER_RESTRICTION_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name={`genderRestriction-${communityId}`}
                value={option.value}
                checked={values.genderRestriction === option.value}
                onChange={(e) => set({ genderRestriction: e.target.value })}
                disabled={loading}
                className="w-4 h-4"
              />
              <span className="text-gray-700">
                {option.label} — {option.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={values.requiresApproval}
          onChange={(e) => set({ requiresApproval: e.target.checked })}
          disabled={loading}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-700">
          Require approval before members can join (you approve in Business Dashboard or Admin → Approvals)
        </span>
      </label>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Member capacity (optional)</label>
        <input
          type="number"
          min={1}
          value={values.capacity}
          onChange={(e) => set({ capacity: e.target.value })}
          placeholder="Leave empty for unlimited"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Group Icon (optional)</label>
        <div className="flex gap-4">
          {iconPreview ? (
            <img src={iconPreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
          ) : null}
          <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <Upload size={18} className="mr-2" />
            Choose File
            <input type="file" accept="image/*" onChange={handleIconInput} disabled={loading} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-black !text-white rounded-lg hover:bg-gray-900 font-medium disabled:opacity-50 min-h-[44px]"
        >
          {loading ? 'Creating…' : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center flex items-center justify-center min-h-[44px]"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
