'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Upload } from 'lucide-react'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export default function DonateConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const auth = getAuth()
  const user = auth.currentUser

  const partner = searchParams.get('partnerName') || 'Charitable Partner'
  const paymentLink = searchParams.get('paymentLink') || ''
  const cause = searchParams.get('causeName') || 'Selected cause'
  const causeDescription = searchParams.get('causeDescription') || ''
  const partnerId = searchParams.get('partner')
  const causeId = searchParams.get('cause')

  const [step, setStep] = useState<'info' | 'payment' | 'submit'>('info')
  const [formData, setFormData] = useState({
    amount: '',
    referenceNumber: '',
    notes: '',
  })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleProceedToPayment = () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid donation amount in AED')
      return
    }
    setError('')
    setStep('payment')
    if (paymentLink) {
      window.open(paymentLink, '_blank', 'noopener,noreferrer')
    }
  }

  const handleProofSelect = (file: File | null) => {
    setProofFile(file)
    if (file) {
      setProofPreview(URL.createObjectURL(file))
    } else {
      setProofPreview('')
    }
  }

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.referenceNumber || !formData.amount) {
      setError('Please fill in all required fields')
      return
    }
    if (!proofFile) {
      setError('Please upload a payment proof screenshot')
      return
    }

    const currentUser = auth.currentUser
    if (!currentUser) {
      alert('You must be logged in to submit a donation')
      router.push('/signin')
      return
    }

    setLoading(true)
    try {
      setUploading(true)
      const proofImageUrl = await uploadImageToFirebase(proofFile, 'donation-proofs', {
        preset: 'content',
      })
      setUploading(false)

      await addDoc(
        collection(db, 'donationSubmissions'),
        sanitizeForFirestore({
          userId: currentUser.uid,
          donorName: currentUser.displayName || currentUser.email || 'Anonymous',
          donorEmail: currentUser.email || '',
          amount: parseFloat(formData.amount),
          referenceNumber: formData.referenceNumber.trim(),
          proofImage: proofImageUrl,
          notes: formData.notes.trim() || null,
          causeId: causeId || null,
          causeName: cause,
          partnerId: partnerId || null,
          partnerName: partner,
          status: 'pending_verification',
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
      )

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/donations')
      }, 2500)
    } catch (err) {
      console.error('Error submitting donation:', err)
      setError('Error submitting donation. Please try again.')
    } finally {
      setUploading(false)
      setLoading(false)
    }
  }

  const btnPrimary =
    'w-full min-h-[44px] bg-black hover:bg-neutral-900 text-white py-3 rounded font-semibold text-sm'
  const btnSecondary =
    'w-full min-h-[44px] bg-white text-black border border-neutral-300 hover:bg-neutral-50 py-3 rounded font-semibold text-sm'

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        <Link
          href="/donate"
          className="inline-flex items-center gap-2 text-neutral-700 hover:text-neutral-900 mb-6 min-h-[44px]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Causes
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row bg-neutral-100 text-xs sm:text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {(['info', 'payment', 'submit'] as const).map((s, i) => (
              <div
                key={s}
                className={`flex-1 py-3 px-3 text-center font-semibold ${
                  step === s ? 'bg-black text-white' : 'text-neutral-600'
                }`}
              >
                {i + 1}. {s === 'info' ? 'Amount' : s === 'payment' ? 'Payment' : 'Proof'}
              </div>
            ))}
          </div>

          <div className="p-5 sm:p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            {success ? (
              <div className="text-center py-10">
                <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />
                <h2
                  className="text-2xl mb-2"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  Donation Submitted!
                </h2>
                <p className="text-neutral-600 mb-4">
                  Your payment proof is pending verification. Our team will review it soon.
                </p>
                <p className="text-sm text-neutral-500">Redirecting to your dashboard…</p>
              </div>
            ) : step === 'info' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleProceedToPayment()
                }}
                className="space-y-4"
              >
                <h2 className="text-2xl mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Donation Details
                </h2>
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div>
                  <label className="block font-semibold mb-1 text-sm">Cause</label>
                  <p className="text-neutral-800 bg-neutral-50 p-3 rounded border border-neutral-100">
                    {cause}
                  </p>
                  {causeDescription ? (
                    <p className="text-sm text-neutral-600 mt-2">{causeDescription}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-sm">Payment partner</label>
                  <p className="text-neutral-800 bg-neutral-50 p-3 rounded border border-neutral-100">
                    {partner}
                  </p>
                </div>

                <div>
                  <label htmlFor="amount" className="block font-semibold mb-1 text-sm">
                    Donation Amount (AED) *
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-neutral-300 rounded px-3 py-3 min-h-[44px] focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block font-semibold mb-1 text-sm">
                    Message (Optional)
                  </label>
                  <textarea
                    id="notes"
                    placeholder="Add a personal note"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-neutral-300 rounded px-3 py-3 focus:outline-none focus:border-neutral-900"
                    rows={3}
                  />
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded p-4 text-sm text-neutral-700">
                  <strong>Next:</strong>{' '}
                  {paymentLink
                    ? `You will be redirected to ${partner} to complete payment securely.`
                    : 'No payment link is configured yet — contact Passive Blessings for alternative methods.'}
                </div>

                <button type="submit" className={btnPrimary} disabled={!paymentLink}>
                  Proceed to Payment
                </button>
              </form>
            ) : step === 'payment' ? (
              <div className="text-center py-8 space-y-4">
                <h2 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Completing Payment
                </h2>
                <p className="text-neutral-600">
                  A window should have opened for {partner}. Complete payment there, then continue
                  to upload your proof.
                </p>
                {paymentLink ? (
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${btnSecondary} inline-flex items-center justify-center`}
                  >
                    Re-open payment page
                  </a>
                ) : null}
                <button type="button" onClick={() => setStep('submit')} className={btnPrimary}>
                  Payment Complete — Continue
                </button>
                <button type="button" onClick={() => setStep('info')} className={btnSecondary}>
                  Go Back
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitProof} className="space-y-4">
                <h2 className="text-2xl mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Upload Payment Proof
                </h2>
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div>
                  <label className="block font-semibold mb-1 text-sm">Cause (read-only)</label>
                  <p className="text-neutral-800 bg-neutral-50 p-3 rounded border">{cause}</p>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-sm">Amount donated (AED)</label>
                  <p className="text-neutral-800 bg-neutral-50 p-3 rounded border">
                    AED {formData.amount}
                  </p>
                </div>

                <div>
                  <label htmlFor="referenceNumber" className="block font-semibold mb-1 text-sm">
                    Payment Reference Number *
                  </label>
                  <input
                    id="referenceNumber"
                    type="text"
                    placeholder="Transaction / reference number"
                    value={formData.referenceNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, referenceNumber: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded px-3 py-3 min-h-[44px] focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="proofFile" className="block font-semibold mb-1 text-sm">
                    Payment proof screenshot *
                  </label>
                  <input
                    id="proofFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProofSelect(e.target.files?.[0] || null)}
                    className="w-full border border-neutral-300 rounded px-3 py-3 min-h-[44px] file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-neutral-100 file:text-sm"
                    required
                  />
                  {proofPreview ? (
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="mt-3 max-h-48 rounded border object-contain"
                    />
                  ) : null}
                  <p className="text-xs text-neutral-500 mt-1">
                    Image uploads to Firebase Storage; only the URL is saved in Firestore.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-900">
                  Ensure the screenshot clearly shows amount, reference, and timestamp.
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => setStep('payment')} className={btnSecondary}>
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className={`${btnPrimary} flex items-center justify-center gap-2 disabled:opacity-50`}
                  >
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Uploading…' : loading ? 'Submitting…' : 'Submit Proof'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
