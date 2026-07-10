'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { uploadFileToFirebase } from '@/lib/upload-utils'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function VendorApplyPage() {
  const { firebaseUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    description: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
  })
  const [documentsURL, setDocumentsURL] = useState('')

  const handleDoc = async (file: File) => {
    const url = await uploadFileToFirebase(file, 'vendor-applications', `vendor_${Date.now()}_${file.name}`)
    setDocumentsURL(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : null
      const res = await fetch('/api/vendor/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, documentsURL }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Become a Business Partner</h1>
        <p className="text-muted-foreground mb-4">
          Apply to list your business on Passive Blessings marketplace and directory.
        </p>
        {!firebaseUser && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
            <Link href="/login?returnUrl=/vendor/apply" className="font-semibold underline">
              Sign in
            </Link>{' '}
            with the email you use below so we can link your account when approved.
          </p>
        )}

        {success ? (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              Application submitted. Our team will review and notify you by email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-[#e4e1da] rounded-lg p-6">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {(['businessName', 'businessType', 'contactEmail', 'contactPhone', 'website'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  required={field !== 'website' && field !== 'contactPhone'}
                  type={field.includes('Email') ? 'email' : 'text'}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full min-h-[44px] px-3 border border-gray-300 rounded-lg"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supporting documents (PDF/image)</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleDoc(f)
                }}
                className="w-full text-sm"
              />
              {documentsURL && <p className="text-xs text-green-700 mt-1">Document uploaded</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] bg-black text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}
