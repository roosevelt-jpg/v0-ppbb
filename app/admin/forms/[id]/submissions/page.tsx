'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FormSubmission, CustomForm } from '@/lib/form-builder-types'
import { getFormById, subscribeToFormSubmissions } from '@/lib/form-builder-queries'
import { Card } from '@/components/ui/card'
import { ChevronLeft, Eye, Download } from 'lucide-react'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_ICON_PRIMARY,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
} from '@/lib/admin-design-system'
import {
  formatFieldDisplayValue,
  isFileFieldValue,
  getPublicFormPath,
} from '@/lib/form-builder-utils'

function SubmissionsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-neutral-200 rounded-lg" />
      ))}
    </div>
  )
}

export default function FormSubmissionsByFormPage() {
  const params = useParams()
  const formId = params?.id as string

  const [form, setForm] = useState<CustomForm | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    let unsub = () => {}
    const load = async () => {
      try {
        const formData = await getFormById(formId)
        setForm(formData)
        unsub = subscribeToFormSubmissions(formId, setSubmissions)
      } catch (error) {
        console.error('[v0] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    void load()
    return () => unsub()
  }, [formId])

  const handleDownloadCSV = () => {
    if (submissions.length === 0 || !form) return

    const headers: string[] = ['ID', 'Email', 'Submitted At', 'Status']
    form.sections.forEach((section) => {
      section.fields.forEach((field) => headers.push(field.label))
    })

    const rows = submissions.map((submission) => {
      const row = [
        submission.id,
        submission.userEmail || 'N/A',
        new Date(submission.submittedAt).toISOString(),
        submission.status,
      ]
      form.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const value = submission.responses[field.id]
          row.push(formatFieldDisplayValue(value, field.type))
        })
      })
      return row
    })

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `${form.title}-submissions.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter === 'all') return true
    return s.status === statusFilter
  })

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-10 bg-neutral-200 rounded w-1/2 animate-pulse" />
        <SubmissionsSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/forms" className={`inline-flex items-center gap-2 ${BUTTON_SECONDARY} self-start`}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-headline text-2xl sm:text-3xl font-bold truncate">{form?.title} — Submissions</h1>
          <p className="text-neutral-600 font-body mt-1 text-sm sm:text-base">
            {submissions.length} total submission{submissions.length === 1 ? '' : 's'}
            {form?.slug && form.status === 'active' ? (
              <span className="block sm:inline sm:ml-3 text-neutral-500">
                Public URL: {getPublicFormPath(form.slug)}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleDownloadCSV} className={`${BUTTON_SECONDARY} inline-flex items-center gap-2`}>
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'reviewed', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={statusFilter === status ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <Card className="p-8 text-center text-neutral-600 font-body">
            <p>No submissions yet.</p>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold font-body">{submission.userEmail || 'Anonymous'}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded capitalize ${
                        submission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : submission.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 font-body">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </p>

                  {form?.sections.map((section) => (
                    <div key={section.id} className="border-t border-neutral-100 pt-3">
                      {section.title ? (
                        <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 font-body mb-2">
                          {section.title}
                        </p>
                      ) : null}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {section.fields.map((field) => {
                          const value = submission.responses[field.id]
                          return (
                            <div key={field.id} className="text-sm font-body">
                              <p className="text-neutral-500">{field.label}</p>
                              {field.type === 'file' && isFileFieldValue(value) ? (
                                <a
                                  href={value.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-black underline font-medium break-all"
                                >
                                  {value.name || 'Download attachment'}
                                </a>
                              ) : (
                                <p className="font-medium text-neutral-900 break-words">
                                  {formatFieldDisplayValue(value, field.type)}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/admin/forms/submissions/${submission.id}`}
                  className={BUTTON_ICON_PRIMARY}
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
