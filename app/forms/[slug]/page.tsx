'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import DynamicFormRenderer from '@/components/form-builder/DynamicFormRenderer'
import type { CustomForm, FormSubmissionValue } from '@/lib/form-builder-types'

function PublicFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 animate-pulse">
      <div className="h-40 bg-neutral-200 rounded-lg" />
      <div className="h-8 bg-neutral-200 rounded w-2/3" />
      <div className="h-4 bg-neutral-200 rounded w-full" />
      <div className="h-32 bg-neutral-200 rounded" />
      <div className="h-12 bg-neutral-200 rounded w-40" />
    </div>
  )
}

export default function PublicFormPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [form, setForm] = useState<CustomForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/forms?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
        const json = await res.json()
        if (json.success && json.data) {
          setForm(json.data as CustomForm)
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [slug])

  const handleSubmit = async (responses: FormSubmissionValue) => {
    setSubmitting(true)
    try {
      const emailField = form?.sections
        .flatMap((s) => s.fields)
        .find((f) => f.type === 'email')
      const userEmail = emailField ? String(responses[emailField.id] || '') : ''

      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, responses, userEmail }),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || 'Submission failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-neutral-50 py-8 sm:py-12 px-4 sm:px-6">
        {loading ? (
          <PublicFormSkeleton />
        ) : notFound || !form ? (
          <div className="max-w-lg mx-auto text-center py-16">
            <h1 className="font-headline text-2xl font-bold text-neutral-900 mb-2">Form not found</h1>
            <p className="font-body text-neutral-600">This form may be inactive or the link is incorrect.</p>
          </div>
        ) : (
          <DynamicFormRenderer
            form={form}
            formSlug={slug}
            formId={form.id}
            onSubmit={handleSubmit}
            isLoading={submitting}
          />
        )}
      </main>
      <Footer />
    </>
  )
}
