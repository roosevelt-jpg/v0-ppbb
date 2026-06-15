'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormSubmission, CustomForm } from '@/lib/form-builder-types'
import { getFormById, getFormSubmissions } from '@/lib/form-builder-queries'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, Eye, Download } from 'lucide-react'

export default function FormSubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params?.id as string

  const [form, setForm] = useState<CustomForm | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        const formData = await getFormById(formId)
        setForm(formData)

        const submissionsData = await getFormSubmissions(formId, {
          status: statusFilter === 'all' ? undefined : statusFilter,
        })
        setSubmissions(submissionsData)
      } catch (error) {
        console.error('[v0] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [formId, statusFilter])

  const handleDownloadCSV = () => {
    if (submissions.length === 0) return

    // Get all field labels from form
    const headers: string[] = ['ID', 'Email', 'Submitted At', 'Status']
    form?.sections.forEach(section => {
      section.fields.forEach(field => {
        headers.push(field.label)
      })
    })

    // Create CSV content
    const rows = submissions.map(submission => {
      const row = [
        submission.id,
        submission.userEmail || 'N/A',
        submission.submittedAt.toString(),
        submission.status,
      ]

      form?.sections.forEach(section => {
        section.fields.forEach(field => {
          const value = submission.responses[field.id] || ''
          row.push(Array.isArray(value) ? value.join('; ') : value)
        })
      })

      return row
    })

    // Create CSV string
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Download
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `${form?.title || 'form'}-submissions.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading submissions...</p>
      </div>
    )
  }

  const filteredSubmissions = submissions.filter(s => {
    if (statusFilter === 'all') return true
    return s.status === statusFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/forms">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{form?.title} - Submissions</h1>
          <p className="text-gray-600 mt-1">Total submissions: {submissions.length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleDownloadCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {(['all', 'pending', 'reviewed', 'approved', 'rejected'] as const).map(status => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <Card className="p-8 text-center text-gray-600">
            <p>No submissions found.</p>
          </Card>
        ) : (
          filteredSubmissions.map(submission => (
            <Card key={submission.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{submission.userEmail || 'Anonymous'}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded mt-2 ${
                      submission.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : submission.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {submission.status}
                  </span>
                </div>
                <Link href={`/admin/forms/submissions/${submission.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
