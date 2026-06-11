'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { AdminHeader } from '@/components/admin-layout'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default function DonationVerificationPage() {
  const [submissions, setSubmissions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedSubmission, setSelectedSubmission] = React.useState<any>(null)

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'donationSubmissions'), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => (b.submittedAt?.toDate?.() || 0) - (a.submittedAt?.toDate?.() || 0))
      setSubmissions(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleVerify = async (submissionId: string) => {
    const submission = submissions.find((s) => s.id === submissionId)
    if (!submission) return

    try {
      // Generate PDF receipt
      const receiptResponse = await fetch('/api/donations/generate-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId: submissionId }),
      })

      let receiptUrl = null
      if (receiptResponse.ok) {
        const receiptData = await receiptResponse.json()
        receiptUrl = receiptData.receiptUrl
      }

      // Update submission status with receipt URL
      await updateDoc(doc(db, 'donationSubmissions', submissionId), {
        status: 'verified',
        verifiedAt: serverTimestamp(),
        verifiedBy: 'admin',
        receiptUrl,
      })

      // Update donor profile with donation
      await updateDoc(doc(db, 'users', submission.userId), {
        totalDonations: (submission.userTotalDonations || 0) + submission.amount,
        lastDonationDate: serverTimestamp(),
      })

      // Update cause progress
      const causeRef = doc(db, 'causes', submission.causeId)
      await updateDoc(causeRef, {
        currentAmount: (submission.currentCauseAmount || 0) + submission.amount,
      })

      setSelectedSubmission(null)
    } catch (error) {
      console.error('[v0] Error verifying donation:', error)
    }
  }

  const handleReject = async (submissionId: string, reason: string) => {
    await updateDoc(doc(db, 'donationSubmissions', submissionId), {
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: serverTimestamp(),
    })
    setSelectedSubmission(null)
  }

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending')
  const verifiedSubmissions = submissions.filter((s) => s.status === 'verified')
  const rejectedSubmissions = submissions.filter((s) => s.status === 'rejected')

  return (
    <div>
      <AdminHeader title="Donation Verification" subtitle="Verify donation submissions and process approvals" />

      <div className="space-y-8">
        {/* Pending Submissions */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-sm font-bold">
              {pendingSubmissions.length}
            </span>
            Pending Verification
          </h2>

          {pendingSubmissions.length === 0 ? (
            <p className="text-gray-500">No pending submissions</p>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold">{submission.donorName}</p>
                      <p className="text-sm text-gray-600">Amount: AED {submission.amount}</p>
                      <p className="text-sm text-gray-600">Cause: {submission.causeName}</p>
                      <p className="text-sm text-gray-600">Reference: {submission.referenceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(submission.submittedAt?.toDate?.() || new Date(), { addSuffix: true })}
                      </p>
                      {submission.proofImage && (
                        <a
                          href={submission.proofImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Proof
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerify(submission.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium"
                    >
                      Verify & Approve
                    </button>
                    <button
                      onClick={() =>
                        handleReject(submission.id, prompt('Enter rejection reason:') || 'No reason provided')
                      }
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verified Submissions */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-bold">
              {verifiedSubmissions.length}
            </span>
            Verified Donations
          </h2>

          {verifiedSubmissions.length === 0 ? (
            <p className="text-gray-500">No verified donations</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {verifiedSubmissions.map((submission) => (
                <div key={submission.id} className="border-l-4 border-green-500 pl-3 py-2">
                  <p className="text-sm">
                    <span className="font-semibold">{submission.donorName}</span> - AED {submission.amount} to{' '}
                    <span className="font-semibold">{submission.causeName}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Verified {formatDistanceToNow(submission.verifiedAt?.toDate?.() || new Date(), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejected Submissions */}
        {rejectedSubmissions.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm font-bold">
                {rejectedSubmissions.length}
              </span>
              Rejected Submissions
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rejectedSubmissions.map((submission) => (
                <div key={submission.id} className="border-l-4 border-red-500 pl-3 py-2">
                  <p className="text-sm">
                    <span className="font-semibold">{submission.donorName}</span> - AED {submission.amount}
                  </p>
                  <p className="text-xs text-red-600">{submission.rejectionReason}</p>
                  <p className="text-xs text-gray-500">
                    Rejected {formatDistanceToNow(submission.rejectedAt?.toDate?.() || new Date(), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
