'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { CustomForm, FormStatistics } from '@/lib/form-builder-types'
import {
  getAllForms,
  getFormStatistics,
  createDefaultForms,
} from '@/lib/form-builder-queries'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Edit2, Eye, Trash2, Archive } from 'lucide-react'
import { deleteForm } from '@/lib/form-builder-queries'

export default function FormsPage() {
  const [forms, setForms] = useState<CustomForm[]>([])
  const [stats, setStats] = useState<FormStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize default forms
        await createDefaultForms()

        // Fetch forms
        const allForms = await getAllForms()
        setForms(allForms)

        // Fetch statistics
        const statistics = await getFormStatistics()
        setStats(statistics)
      } catch (error) {
        console.error('[v0] Error loading forms:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading forms...</p>
      </div>
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
        <Link href="/admin/forms/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
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
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map(option => (
          <Button
            key={option}
            variant={filter === option ? 'default' : 'outline'}
            onClick={() => setFilter(option)}
            className="capitalize"
          >
            {option}
          </Button>
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{form.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {form.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            form.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {form.status}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {form.submissionCount} submissions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/admin/forms/${form.id}/submissions`}>
                    <Button variant="ghost" size="sm" title="View Submissions">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/forms/${form.id}`}>
                    <Button variant="ghost" size="sm" title="Edit Form">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteForm(form.id)}
                    title="Delete Form"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
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
