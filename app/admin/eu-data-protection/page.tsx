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
  const [acceptanceStats, setAcceptanceStats] = useState<{ total: number; currentVersion: number } | null>(
    null
  )

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
        setRequiresAcceptance(Boolean(data.requiresAcceptance))
      } else {
        setPolicy(null)
        setTitle(DEFAULT_TITLE)
        setContent(DEFAULT_CONTENT)
        setStatus('draft')
        setRequiresAcceptance(true)
      }
    } catch (error) {
      console.error('[v0] Error loading policy:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error loading policy',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPolicy()
  }, [loadPolicy])

  useEffect(() => {
    adminApiFetch<{ total: number; currentVersion: number }>('/api/admin/eu-policy/acceptances')
      .then((json) => {
        if (json.success && json.data) setAcceptanceStats(json.data)
      })
      .catch((error) => console.error('[v0] Error loading acceptance stats:', error))
  }, [policy?.version])

  const persistPolicy = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const json = await adminApiFetch<Record<string, unknown>>('/api/admin/eu-policy', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          status: publish ? 'active' : status,
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
      setMessage({
        type: 'success',
        text: publish
          ? 'Policy published successfully!'
          : `Policy saved as draft. Version ${data.version} is stored.`,
      })
      setTimeout(() => setMessage(null), 5000)
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
          <p className="text-neutral-500 dark:text-muted-foreground">Loading policy...</p>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="EU Data Protection Policy" subtitle="Manage GDPR compliance and user acceptance tracking">
      <div className="space-y-6">
        {message && (
          <Card
            className={`p-4 flex items-center gap-3 border ${
              message.type === 'success'
                ? 'border-neutral-300 dark:border-border bg-neutral-50 dark:bg-muted'
                : 'border-red-200 bg-red-50'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-neutral-900 dark:text-foreground shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <p className={message.type === 'success' ? 'text-neutral-900 dark:text-foreground' : 'text-red-800'}>
              {message.text}
            </p>
          </Card>
        )}

        {acceptanceStats && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border border-neutral-200 dark:border-border">
              <p className="text-sm text-neutral-500 dark:text-muted-foreground">Total acceptances recorded</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-foreground">{acceptanceStats.total}</p>
            </Card>
            <Card className="p-4 border border-neutral-200 dark:border-border">
              <p className="text-sm text-neutral-500 dark:text-muted-foreground">Accepted current version (v{policy?.version ?? '—'})</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-foreground">{acceptanceStats.currentVersion}</p>
            </Card>
          </div>
        )}

        <Card className="p-6 sm:p-8 border border-neutral-200 dark:border-border">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-900 dark:text-foreground">Policy Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={DEFAULT_TITLE}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-border rounded-md bg-neutral-50 dark:bg-muted text-neutral-900 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-900 dark:text-foreground">Policy Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the full EU Data Protection Policy text..."
                rows={12}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-border rounded-md bg-neutral-50 dark:bg-muted text-neutral-900 dark:text-foreground font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={requiresAcceptance}
                onChange={(e) => setRequiresAcceptance(e.target.checked)}
                id="requires-acceptance"
                className="cursor-pointer"
              />
              <label htmlFor="requires-acceptance" className="text-neutral-900 dark:text-foreground font-medium cursor-pointer">
                Require users to accept this policy before accessing the website
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-900 dark:text-foreground">Policy Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'archived')}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-border rounded-md bg-neutral-50 dark:bg-muted text-neutral-900 dark:text-foreground"
              >
                <option value="draft">Draft (Not visible to users)</option>
                <option value="active">Active (Visible & Required)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {policy && (
              <div className="bg-neutral-50 dark:bg-muted p-3 rounded-md border-l-4 border-neutral-900 text-sm text-neutral-600 dark:text-muted-foreground space-y-1">
                <p>
                  <strong>Version:</strong> {policy.version}
                </p>
                <p>
                  <strong>Last Updated:</strong> {new Date(policy.lastUpdated).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> {policy.status}
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between">
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
              {saving ? 'Saving...' : 'Save as Draft'}
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
    </AdminPageLayout>
  )
}
