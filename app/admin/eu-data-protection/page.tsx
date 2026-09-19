'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { EUDataProtectionPolicy } from '@/lib/types'
import { adminApiFetch } from '@/lib/admin-api-client'
import { Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/admin-design-system'

const DEFAULT_TITLE = 'EU Data Protection Policy'
const DEFAULT_CONTENT =
  'Please read and accept our data protection policy to continue using this website.'

type AcceptanceStats = {
  total: number
  currentVersion: number
  version?: number | null
  recent?: Array<{
    id: string
    policyVersion: number | null
    userId: string | null
    acceptedAt: string | null
  }>
}

function parsePolicyDates(data: Record<string, unknown>): EUDataProtectionPolicy {
  return {
    ...(data as EUDataProtectionPolicy),
    effectiveDate: data.effectiveDate ? new Date(String(data.effectiveDate)) : new Date(),
    lastUpdated: data.lastUpdated ? new Date(String(data.lastUpdated)) : new Date(),
  }
}

export default function EUDataProtectionAdmin() {
  const [policy, setPolicy] = useState<EUDataProtectionPolicy | null>(null)
  const [title, setTitle] = useState(DEFAULT_TITLE)
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft')
  const [requiresAcceptance, setRequiresAcceptance] = useState(true)
  const [acceptanceStats, setAcceptanceStats] = useState<AcceptanceStats>({
    total: 0,
    currentVersion: 0,
    recent: [],
  })

  const loadAcceptances = useCallback(async () => {
    try {
      const json = await adminApiFetch<AcceptanceStats>('/api/admin/eu-policy/acceptances')
      if (json.success && json.data) {
        setAcceptanceStats({
          total: json.data.total ?? 0,
          currentVersion: json.data.currentVersion ?? 0,
          version: json.data.version,
          recent: json.data.recent || [],
        })
      }
    } catch (error) {
      console.error('[v0] Error loading acceptance stats:', error)
    }
  }, [])

  const loadPolicy = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    try {
      const json = await adminApiFetch<Record<string, unknown>>('/api/admin/eu-policy')
      if (!json.success) {
        throw new Error(json.error || 'Failed to load policy')
      }

      if (json.data) {
        const data = parsePolicyDates(json.data)
        setPolicy(data)
        setTitle(data.title || DEFAULT_TITLE)
        setContent(data.content || DEFAULT_CONTENT)
        setStatus(data.status || 'draft')
        setRequiresAcceptance(
          Boolean(data.requiresAcceptance ?? data.acceptanceRequired ?? true)
        )
      } else {
        setPolicy(null)
        setTitle(DEFAULT_TITLE)
        setContent(DEFAULT_CONTENT)
        setStatus('draft')
        setRequiresAcceptance(true)
      }
      await loadAcceptances()
    } catch (error) {
      console.error('[v0] Error loading policy:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error loading policy',
      })
    } finally {
      setLoading(false)
    }
  }, [loadAcceptances])

  useEffect(() => {
    void loadPolicy()
  }, [loadPolicy])

  const persistPolicy = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const nextStatus = publish ? 'active' : status
      const json = await adminApiFetch<Record<string, unknown>>('/api/admin/eu-policy', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          status: nextStatus,
          requiresAcceptance,
          publish,
        }),
      })

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to save policy')
      }

      const data = parsePolicyDates(json.data)
      setPolicy(data)
      setStatus(data.status)
      setRequiresAcceptance(Boolean(data.requiresAcceptance ?? data.acceptanceRequired))
      await loadAcceptances()
      setMessage({
        type: 'success',
        text: publish
          ? requiresAcceptance
            ? 'Policy published. Visitors will be asked to accept this version.'
            : 'Policy published as active, but acceptance popup is OFF — enable the checkbox to require consent.'
          : `Policy saved (v${data.version}, status: ${data.status}).`,
      })
      setTimeout(() => setMessage(null), 8000)
    } catch (error) {
      console.error('[v0] Error saving policy:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error saving policy. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="EU Data Protection Policy" subtitle="Manage GDPR compliance policy">
        <div className="p-8">
          <p className="text-neutral-500">Loading policy...</p>
        </div>
      </AdminPageLayout>
    )
  }

  const popupWillShow = status === 'active' && requiresAcceptance

  return (
    <AdminPageLayout
      title="EU Data Protection Policy"
      subtitle="Manage GDPR compliance and user acceptance tracking"
    >
      <div className="space-y-6 pb-24">
        {message && (
          <Card
            className={`p-4 flex items-center gap-3 border ${
              message.type === 'success'
                ? 'border-neutral-300 bg-neutral-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-neutral-900 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <p className={message.type === 'success' ? 'text-neutral-900' : 'text-red-800'}>
              {message.text}
            </p>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 border border-neutral-200">
            <p className="text-sm text-neutral-500">Total acceptances recorded</p>
            <p className="text-2xl font-semibold text-neutral-900">{acceptanceStats.total}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <p className="text-sm text-neutral-500">
              Accepted current version (v{policy?.version ?? acceptanceStats.version ?? '—'})
            </p>
            <p className="text-2xl font-semibold text-neutral-900">
              {acceptanceStats.currentVersion}
            </p>
          </Card>
        </div>

        {!popupWillShow && (
          <Card className="p-4 border border-amber-200 bg-amber-50 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-950 space-y-1">
              <p className="font-semibold">Site popup will not show right now</p>
              <p>
                Visitors only see the consent dialog when status is <strong>Active</strong> and
                &quot;Require users to accept&quot; is checked. Then click{' '}
                <strong>Publish &amp; Activate</strong>.
              </p>
            </div>
          </Card>
        )}

        <Card className="p-6 sm:p-8 border border-neutral-200">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-900">Policy Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={DEFAULT_TITLE}
                className="w-full px-3 py-2 border border-neutral-200 rounded-md bg-white text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-900">Policy Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the full EU Data Protection Policy text..."
                rows={14}
                className="w-full px-3 py-2 border border-neutral-200 rounded-md bg-white text-neutral-900 font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={requiresAcceptance}
                onChange={(e) => setRequiresAcceptance(e.target.checked)}
                id="requires-acceptance"
                className="mt-1 cursor-pointer"
              />
              <label htmlFor="requires-acceptance" className="text-neutral-900 font-medium cursor-pointer">
                Require users to accept this policy before using the website
                <span className="block text-xs font-normal text-neutral-500 mt-1">
                  When enabled (and status is Active), a full-screen popup appears for new visitors
                  and after each version bump.
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-900">Policy Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'archived')}
                className="w-full px-3 py-2 border border-neutral-200 rounded-md bg-white text-neutral-900"
              >
                <option value="draft">Draft (Not shown to visitors)</option>
                <option value="active">Active (Can show consent popup)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {policy && (
              <div className="bg-neutral-50 p-3 rounded-md border-l-4 border-neutral-900 text-sm text-neutral-600 space-y-1">
                <p>
                  <strong>Version:</strong> {policy.version}
                </p>
                <p>
                  <strong>Last Updated:</strong> {new Date(policy.lastUpdated).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> {policy.status}
                </p>
                <p>
                  <strong>Requires acceptance:</strong>{' '}
                  {policy.requiresAcceptance || policy.acceptanceRequired ? 'Yes' : 'No'}
                </p>
              </div>
            )}
          </div>
        </Card>

        {(acceptanceStats.recent?.length ?? 0) > 0 && (
          <Card className="p-4 sm:p-6 border border-neutral-200">
            <h3 className="font-semibold text-neutral-900 mb-3">Recent acceptances</h3>
            <ul className="divide-y divide-neutral-100 text-sm">
              {acceptanceStats.recent!.map((row) => (
                <li key={row.id} className="py-2 flex flex-wrap gap-x-4 gap-y-1 text-neutral-700">
                  <span>v{row.policyVersion ?? '—'}</span>
                  <span className="text-neutral-500">
                    {row.acceptedAt ? new Date(row.acceptedAt).toLocaleString() : '—'}
                  </span>
                  <span className="text-neutral-500 truncate">
                    {row.userId ? `User ${row.userId.slice(0, 8)}…` : 'Anonymous visitor'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur px-4 py-3 lg:pl-64">
          <div className="max-w-5xl mx-auto flex flex-col-reverse sm:flex-row gap-3 justify-between">
            <button
              type="button"
              data-dashboard-control
              onClick={() => void loadPolicy()}
              disabled={saving}
              className={`${BUTTON_SECONDARY} gap-2`}
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                data-dashboard-control
                onClick={() => void persistPolicy(false)}
                disabled={saving}
                className={`${BUTTON_SECONDARY} gap-2`}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                data-dashboard-control
                onClick={() => void persistPolicy(true)}
                disabled={saving}
                className={`${BUTTON_PRIMARY} gap-2`}
              >
                <CheckCircle className="h-4 w-4" />
                {saving ? 'Publishing...' : 'Publish & Activate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}
