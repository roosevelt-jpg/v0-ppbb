'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { CustomForm, FormStatistics } from '@/lib/form-builder-types'
import {
  getFormStatistics,
  createDefaultForms,
  subscribeToForms,
} from '@/lib/form-builder-queries'
import { AdminPageLayout } from '@/components/admin-page-layout'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_ICON_COMPACT,
  ACTION_ROW,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
} from '@/lib/admin-design-system'
import { Card } from '@/components/ui/card'
import { Plus, Edit2, Eye, Trash2, Copy, Check, RefreshCw } from 'lucide-react'
import { deleteForm } from '@/lib/form-builder-queries'
import { getPublicFormPath } from '@/lib/form-builder-utils'

export default function FormsPage() {
  const [forms, setForms] = useState<CustomForm[]>([])
  const [stats, setStats] = useState<FormStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    let unsub = () => {}
    const loadData = async () => {
      try {
        await createDefaultForms()
        const statistics = await getFormStatistics()
        setStats(statistics)
        unsub = subscribeToForms(setForms)
      } catch (error) {
        console.error('[v0] Error loading forms:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadData()
    return () => unsub()
  }, [])

  const syncPbTemplates = async () => {
    setSyncing(true)
    try {
      await createDefaultForms()
      alert(
        'PB form templates synced:\n• Partnership Inquiry\n• Volunteer with PB (Unpaid Service)\n• Community Feedback\n• Charity Support Request\n\nOpen any form to edit fields or dropdown options.'
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const copyPublicUrl = async (form: CustomForm) => {
    if (!form.slug || form.status !== 'active') return
    const url = `${window.location.origin}${getPublicFormPath(form.slug)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(form.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? All submissions will be deleted.')) {
      return
    }

    try {
      await deleteForm(formId)
      setForms(forms.filter(f => f.id !== formId))
    } catch (error) {
      console.error('[v0] Error deleting form:', error)
      alert('Error deleting form')
    }
  }

  const filteredForms = forms.filter(form => {
    if (filter === 'active') return form.status === 'active'
    if (filter === 'inactive') return form.status !== 'active'
    return true
  })

  if (loading) {
    return (
      <AdminPageLayout title="Custom Forms" subtitle="Loading…">
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-neutral-200 rounded-lg" />
            ))}
          </div>
          <div className="h-12 bg-neutral-200 rounded w-48" />
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-neutral-200 rounded-lg" />
          ))}
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Custom Forms" subtitle="Create and manage custom forms for different purposes">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Forms</h1>
          <p className="text-gray-600 mt-1">Create and manage custom forms for different purposes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void syncPbTemplates()}
            disabled={syncing}
            className={`inline-flex items-center gap-2 ${BUTTON_SECONDARY} disabled:opacity-50`}
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync PB templates'}
          </button>
          <Link href="/admin/forms/new" className={`inline-flex items-center gap-1.5 ${BUTTON_PRIMARY}`}>
            <Plus className="h-3 w-3" />
            Create Form
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Forms</p>
            <p className="text-2xl font-bold mt-2">{stats.totalForms}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Active Forms</p>
            <p className="text-2xl font-bold mt-2">{stats.activeForms}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Submissions</p>
            <p className="text-2xl font-bold mt-2">{stats.totalSubmissions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Pending Reviews</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{stats.pendingReviews}</p>
          </Card>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'inactive'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={filter === option ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Forms List */}
      <div className="space-y-3">
        {filteredForms.length === 0 ? (
          <Card className="p-8 text-center text-gray-600">
            <p>No forms found. Create your first form to get started.</p>
          </Card>
        ) : (
          filteredForms.map(form => (
            <Card key={form.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold font-body">{form.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 font-body line-clamp-2">{form.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-body">
                      {form.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-body ${
                        form.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {form.status}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-body">
                      {form.submissionCount ?? 0} submissions
                    </span>
                  </div>
                  {form.status === 'active' && form.slug ? (
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                      <code className="text-xs bg-neutral-100 px-2 py-1 rounded break-all font-body">
                        {getPublicFormPath(form.slug)}
                      </code>
                      <button
                        type="button"
                        onClick={() => void copyPublicUrl(form)}
                        className={`${BUTTON_SECONDARY} text-xs inline-flex items-center gap-1 self-start`}
                      >
                        {copiedId === form.id ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy link
                          </>
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className={`${ACTION_ROW} flex-shrink-0`}>
                  <Link href={`/admin/forms/${form.id}/submissions`} className={BUTTON_ICON_COMPACT} title="View Submissions">
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                  <Link href={`/admin/forms/${form.id}`} className={BUTTON_ICON_COMPACT} title="Edit Form">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteForm(form.id)}
                    title="Delete Form"
                    className={BUTTON_ICON_COMPACT}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
    </AdminPageLayout>
  )
}
