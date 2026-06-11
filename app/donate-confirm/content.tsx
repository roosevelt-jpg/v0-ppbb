'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Upload } from 'lucide-react'

export default function DonateConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const auth = getAuth()
  const user = auth.currentUser

  const partner = searchParams.get('partnerName')
  const paymentLink = searchParams.get('paymentLink')
  const cause = searchParams.get('causeName')
  const partnerId = searchParams.get('partner')
  const causeId = searchParams.get('cause')

  const [step, setStep] = useState<'info' | 'payment' | 'submit'>('info')
  const [formData, setFormData] = useState({
    amount: '',
    referenceNumber: '',
    proofImage: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleProceedToPayment = () => {
    if (!formData.amount) {
      alert('Please enter donation amount')
      return
    }
    setStep('payment')
    // Open payment link in new window
    if (paymentLink) {
      window.open(paymentLink, '_blank', 'width=800,height=600')
    }
  }

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.referenceNumber || !formData.amount) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (!user) {
        alert('You must be logged in to submit a donation')
        router.push('/signin')
        return
      }

      // Save donation submission to Firestore
      const docRef = await addDoc(collection(db, 'donationSubmissions'), {
        userId: user.uid,
        donorName: user.displayName || user.email || 'Anonymous',
        donorEmail: user.email,
        amount: parseFloat(formData.amount),
        referenceNumber: formData.referenceNumber,
        proofImage: formData.proofImage,
        notes: formData.notes,
        causeId: causeId,
        causeName: cause,
        partnerId: partnerId,
        partnerName: partner,
        status: 'pending',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/donations')
      }, 3000)
    } catch (error) {
      console.error('Error submitting donation:', error)
      alert('Error submitting donation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Link href="/donate" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Causes
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Progress Steps */}
          <div className="flex bg-gray-100">
            <div className={`flex-1 py-4 px-4 text-center ${step === 'info' ? 'bg-blue-500 text-white' : ''}`}>
              <p className="font-semibold">1. Donation Info</p>
            </div>
            <div className={`flex-1 py-4 px-4 text-center ${step === 'payment' ? 'bg-blue-500 text-white' : ''}`}>
              <p className="font-semibold">2. Payment</p>
            </div>
            <div className={`flex-1 py-4 px-4 text-center ${step === 'submit' ? 'bg-blue-500 text-white' : ''}`}>
              <p className="font-semibold">3. Proof Upload</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {success ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Donation Submitted!</h2>
                <p className="text-gray-600 mb-6">
                  Thank you for your generosity. Your donation proof has been submitted for verification. Our team will
                  review it within 24 hours.
                </p>
                <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
              </div>
            ) : step === 'info' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleProceedToPayment()
                }}
              >
                <h2 className="text-2xl font-bold mb-4">Donation Details</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block font-semibold mb-1">Cause</label>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{cause}</p>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Charity Partner</label>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{partner}</p>
                  </div>

                  <div>
                    <label htmlFor="amount" className="block font-semibold mb-1">
                      Donation Amount (AED) *
                    </label>
                    <input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full border rounded px-3 py-2 border-gray-300 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block font-semibold mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      id="notes"
                      placeholder="Add a personal message or note"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full border rounded px-3 py-2 border-gray-300 focus:outline-none focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    <strong>Next:</strong> You&apos;ll be redirected to {partner} to complete the payment securely. After
                    completing payment, return here to upload your proof of payment.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold"
                >
                  Proceed to Payment
                </button>
              </form>
            ) : step === 'payment' ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Completing Payment</h2>
                <p className="text-gray-600 mb-6">
                  A new window has opened with {partner}. Complete your payment there, then click below to continue.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setStep('submit')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-semibold"
                  >
                    Payment Complete - Continue
                  </button>
                  <button
                    onClick={() => setStep('info')}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 py-3 rounded font-semibold"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitProof}>
                <h2 className="text-2xl font-bold mb-4">Upload Payment Proof</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block font-semibold mb-1">Donation Amount</label>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">AED {formData.amount}</p>
                  </div>

                  <div>
                    <label htmlFor="referenceNumber" className="block font-semibold mb-1">
                      Payment Reference Number *
                    </label>
                    <input
                      id="referenceNumber"
                      type="text"
                      placeholder="Enter reference/transaction number from payment receipt"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      className="w-full border rounded px-3 py-2 border-gray-300 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="proofImage" className="block font-semibold mb-1">
                      Payment Proof Screenshot/Image *
                    </label>
                    <input
                      id="proofImage"
                      type="url"
                      placeholder="Paste image URL of payment screenshot"
                      value={formData.proofImage}
                      onChange={(e) => setFormData({ ...formData, proofImage: e.target.value })}
                      className="w-full border rounded px-3 py-2 border-gray-300 focus:outline-none focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload your payment proof screenshot using an image hosting service and paste the URL
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
                  <p className="text-sm text-yellow-900">
                    <strong>Important:</strong> Please ensure your proof clearly shows the transaction amount, reference
                    number, and timestamp. Our verification team will review within 24 hours.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-3 rounded font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded font-semibold flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    {loading ? 'Submitting...' : 'Submit Proof'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            Your donation will be recorded immediately upon verification. You&apos;ll receive a tax receipt via email.
          </p>
        </div>
      </div>
    </div>
  )
}
