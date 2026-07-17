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
import { parseDonationPaymentType } from '@/lib/donation-payment-links'

export default function DonateConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const auth = getAuth()

  const partner = searchParams.get('partnerName') || 'Charitable Partner'
  const paymentLink = searchParams.get('paymentLink') || ''
  const cause = searchParams.get('causeName') || 'Selected cause'
  const causeDescription = searchParams.get('causeDescription') || ''
  const partnerId = searchParams.get('partner')
  const causeId = searchParams.get('cause')
  const donationType = parseDonationPaymentType(searchParams.get('donationType')) || 'sadaqah'
  const donationTypeLabel = donationType === 'zakat' ? 'Zakat' : 'Sadaqah'

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

      const submission = await addDoc(
        collection(db, 'donationSubmissions'),
        sanitizeForFirestore({
          userId: currentUser.uid,
          donorName: currentUser.displayName || currentUser.email || 'Anonymous',
          donorEmail: currentUser.email || '',
          donorPhone: currentUser.phoneNumber || null,
          amount: parseFloat(formData.amount),
          referenceNumber: formData.referenceNumber.trim(),
          proofImage: proofImageUrl,
          notes: formData.notes.trim() || null,
          causeId: causeId || null,
          causeName: cause,
          partnerId: partnerId || null,
          partnerName: partner,
          donationType,
          status: 'pending_verification',
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
      )

      try {
        const token = await currentUser.getIdToken()
        await fetch('/api/donations/notify-pending', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ submissionId: submission.id }),
        })
      } catch (notifyErr) {
        console.warn('[donate-confirm] admin notify failed:', notifyErr)
      }

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
    'w-full h-8 min-h-0 bg-black hover:bg-neutral-900 text-white px-3 rounded-md font-semibold text-[11px]'
  const btnSecondary =
    'w-full h-8 min-h-0 bg-black hover:bg-neutral-800 text-white px-3 rounded-md font-semibold text-[11px]'

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-4 sm:py-6 px-3 sm:px-4">
      <div className="max-w-lg mx-auto w-full">
        <Link
          href="/donate"
          className="inline-flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 mb-3 text-xs font-semibold"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Causes
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div
            className="flex flex-col sm:flex-row bg-neutral-100 text-[11px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {(['info', 'payment', 'submit'] as const).map((s, i) => (
              <div
                key={s}
                className={`flex-1 py-2 px-2 text-center font-semibold ${
                  step === s ? 'bg-black text-white' : 'text-neutral-600'
                }`}
              >
                {i + 1}. {s === 'info' ? 'Amount' : s === 'payment' ? 'Payment' : 'Proof'}
              </div>
            ))}
          </div>

          <div className="p-3.5 sm:p-5" style={{ fontFamily: 'Inter, sans-serif' }}>
            {success ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <h2 className="text-xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Donation Submitted!
                </h2>
                <p className="text-neutral-600 text-sm mb-2">
                  Your payment proof is pending verification. Our team will review it soon.
                </p>
                <p className="text-xs text-neutral-500">Redirecting to your dashboard…</p>
              </div>
            ) : step === 'info' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleProceedToPayment()
                }}
                className="space-y-2.5"
              >
                <h2 className="text-xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Donation Details
                </h2>
                {error && <p className="text-xs text-red-600">{error}</p>}

                <div>
                  <label className="block font-semibold mb-0.5 text-xs">Cause</label>
                  <p className="text-neutral-800 bg-neutral-50 px-2.5 py-2 rounded-md border border-neutral-100 text-sm">
                    {cause}
                  </p>
                  {causeDescription ? (
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{causeDescription}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block font-semibold mb-0.5 text-xs">Donation type</label>
                  <p className="text-neutral-800 bg-neutral-50 px-2.5 py-2 rounded-md border border-neutral-100 text-sm">
                    {donationTypeLabel}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold mb-0.5 text-xs">Payment partner</label>
                  <p className="text-neutral-800 bg-neutral-50 px-2.5 py-2 rounded-md border border-neutral-100 text-sm">
                    {partner}
                  </p>
                </div>

                <div>
                  <label htmlFor="amount" className="block font-semibold mb-0.5 text-xs">
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
                    className="w-full border border-neutral-300 rounded-md px-2.5 py-2 h-9 text-sm focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block font-semibold mb-0.5 text-xs">
                    Message (Optional)
                  </label>
                  <textarea
                    id="notes"
                    placeholder="Add a personal note"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-neutral-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:border-neutral-900"
                    rows={2}
                  />
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-md p-2.5 text-xs text-neutral-700">
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
              <div className="text-center py-4 space-y-2.5">
                <h2 className="text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Completing Payment
                </h2>
                <p className="text-neutral-600 text-sm">
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
              <form onSubmit={handleSubmitProof} className="space-y-2.5">
                <h2 className="text-xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Upload Payment Proof
                </h2>
                {error && <p className="text-xs text-red-600">{error}</p>}

                <div>
                  <label className="block font-semibold mb-0.5 text-xs">Cause (read-only)</label>
                  <p className="text-neutral-800 bg-neutral-50 px-2.5 py-2 rounded-md border text-sm">
                    {cause}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold mb-0.5 text-xs">Amount donated (AED)</label>
                  <p className="text-neutral-800 bg-neutral-50 px-2.5 py-2 rounded-md border text-sm">
                    AED {formData.amount}
                  </p>
                </div>

                <div>
                  <label htmlFor="referenceNumber" className="block font-semibold mb-0.5 text-xs">
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
                    className="w-full border border-neutral-300 rounded-md px-2.5 py-2 h-9 text-sm focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="proofFile" className="block font-semibold mb-0.5 text-xs">
                    Payment proof screenshot *
                  </label>
                  <input
                    id="proofFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProofSelect(e.target.files?.[0] || null)}
                    className="w-full border border-neutral-300 rounded-md px-2.5 py-2 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-neutral-100 file:text-xs"
                    required
                  />
                  {proofPreview ? (
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="mt-2 max-h-36 rounded border object-contain"
                    />
                  ) : null}
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Image uploads to Firebase Storage; only the URL is saved in Firestore.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 text-xs text-amber-900">
                  Ensure the screenshot clearly shows amount, reference, and timestamp.
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="button" onClick={() => setStep('payment')} className={btnSecondary}>
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className={`${btnPrimary} flex items-center justify-center gap-1.5 disabled:opacity-50`}
                  >
                    <Upload className="w-3.5 h-3.5" />
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
