'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, ArrowLeft, DollarSign, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/admin-design-system'
import { adminApiFetch } from '@/lib/admin-api-client'
import { useAdminAudit } from '@/lib/use-admin-audit'
import { AdminPageLayout } from '@/components/admin-page-layout'

function DonationDetailInner() {
  const audit = useAdminAudit()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const donationId = params.id as string
  const sourceHint = searchParams.get('source') || ''

  const [donation, setDonation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        if (!donationId) {
          setError('Donation ID not found')
          return
        }

        const qs = new URLSearchParams({ id: donationId })
        if (sourceHint) qs.set('source', sourceHint)
        const json = await adminApiFetch(`/api/admin/donations?${qs.toString()}`)
        if (!json.success || !json.data) {
          setError(json.error || 'Donation not found')
          return
        }

        setDonation(json.data)
        setFormData(json.data)
      } catch (err) {
        console.error('[v0] Error fetching donation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load donation details')
      } finally {
        setLoading(false)
      }
    }

    void fetchDonation()
  }, [donationId, sourceHint])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const json = await adminApiFetch('/api/admin/donations', {
        method: 'PATCH',
        body: JSON.stringify({
          id: donationId,
          source: donation?._source || sourceHint || undefined,
          donorName: formData.donorName || '',
          donorEmail: formData.donorEmail || formData.email || '',
          amount: formData.amount,
          type: formData.type || 'monetary',
          purpose: formData.purpose || '',
          notes: formData.notes || '',
          status: formData.status || 'completed',
          paymentMethod: formData.paymentMethod || 'bank-transfer',
          targetCase: formData.targetCase || '',
        }),
      })
      if (!json.success) throw new Error(json.error || 'Failed to update donation')
      audit({
        actionType: 'update',
        action: `Updated donation: ${donationId}`,
        entityType: 'donation',
        entityId: donationId,
        status: 'success',
      })
      setSuccess('Donation updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[admin/donations] Error updating donation:', err)
      setError(err instanceof Error ? err.message : 'Failed to update donation')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Donation Details" subtitle="Loading…">
        <div className="py-12 text-center text-neutral-500">Loading donation details…</div>
      </AdminPageLayout>
    )
  }

  if (error && !donation) {
    return (
      <AdminPageLayout title="Donation Details" subtitle="Not found">
        <div className="py-12 text-center text-red-600 space-y-4">
          <p>{error}</p>
          <button type="button" onClick={() => router.push('/admin/donations')} className={BUTTON_SECONDARY}>
            Back to donations
          </button>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout title="Donation Details" subtitle="View and manage donation information">
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/donations')}
            className="p-2 hover:bg-neutral-200 rounded-lg transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Donation Details</h1>
            <p className="text-sm text-neutral-600">
              {donation?._source === 'donationSubmissions' ? 'Bank / form submission' : 'Donation record'}
            </p>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        ) : null}

        <Card className="p-6 border border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Donation Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Donor Name</label>
              <input
                type="text"
                name="donorName"
                value={formData.donorName || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input
                type="email"
                name="donorEmail"
                value={formData.donorEmail || formData.email || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Amount (AED)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount || 0}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Currency</label>
              <input
                type="text"
                name="currency"
                value={formData.currency || 'AED'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Target case</label>
              <input
                type="text"
                name="targetCase"
                value={formData.targetCase || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status || 'pending'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Purpose / Notes</label>
            <textarea
              name="purpose"
              value={formData.purpose || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-neutral-600">Amount</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {formData.currency || 'AED'} {formData.amount || 0}
            </p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-neutral-600">Created</span>
            </div>
            <p className="text-sm font-semibold text-neutral-900">
              {formData.createdAt
                ? new Date(
                    formData.createdAt?.toDate
                      ? formData.createdAt.toDate()
                      : formData.createdAt?.seconds
                        ? formData.createdAt.seconds * 1000
                        : formData.createdAt
                  ).toLocaleString()
                : 'N/A'}
            </p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-neutral-600">Status</span>
            </div>
            <p className="text-lg font-semibold text-orange-600 capitalize">
              {formData.status || 'Pending'}
            </p>
          </Card>
        </div>

        {donation?.receiptUrl ? (
          <Card className="p-6 border border-neutral-200">
            <h3 className="font-semibold text-neutral-900 mb-2">Receipt / proof</h3>
            <a
              href={donation.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Open file
            </a>
          </Card>
        ) : null}

        <div className="flex gap-2">
          <button type="button" onClick={() => void handleSave()} disabled={saving} className={`${BUTTON_PRIMARY} px-6 py-2`}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.push('/admin/donations')} className={`${BUTTON_SECONDARY} px-6 py-2`}>
            Back
          </button>
        </div>
      </div>
    </AdminPageLayout>
  )
}

export default function DonationDetailPage() {
  return (
    <Suspense
      fallback={
        <AdminPageLayout title="Donation Details" subtitle="Loading…">
          <div className="py-12 text-center text-neutral-500">Loading donation details…</div>
        </AdminPageLayout>
      }
    >
      <DonationDetailInner />
    </Suspense>
  )
}
