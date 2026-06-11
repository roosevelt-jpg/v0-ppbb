'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import Link from 'next/link'
import { Heart, ArrowRight, CheckCircle } from 'lucide-react'

export default function DonationPage() {
  const [causes, setCauses] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [selectedCause, setSelectedCause] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch active causes
    const unsubscribeCauses = onSnapshot(
      query(collection(db, 'causes'), where('status', '==', 'active')),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setCauses(data)
      }
    )

    // Fetch active charity partners
    const unsubscribePartners = onSnapshot(
      query(collection(db, 'charityPartners'), where('status', '==', 'active')),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setPartners(data)
        setLoading(false)
      }
    )

    return () => {
      unsubscribeCauses()
      unsubscribePartners()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading donation options...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Make a Difference</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Passive Blessings acts as a community mobilizer and awareness partner. Funds are collected through official
            charitable partners including Beit Al Khair, ensuring transparency and direct impact.
          </p>
        </div>

        {/* Partnership Statement */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12 border-l-4 border-blue-500">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-blue-500" />
            In Partnership with Approved Charitable Entities
          </h2>
          <p className="text-gray-700 mb-4">
            Passive Blessings operates as a trusted community platform connecting donors with verified charitable
            partners. Your donation is managed through these official organizations, ensuring:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">✓</span>
              <span>Complete transparency in fund collection and distribution</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">✓</span>
              <span>Verified charitable organizations with regulatory approval</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">✓</span>
              <span>Real-time impact tracking and community engagement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">✓</span>
              <span>Tax-compliant donation receipts for all contributions</span>
            </li>
          </ul>
        </div>

        {/* Causes Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Choose a Cause</h2>

          {causes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No active causes at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {causes.map((cause) => {
                const progress = (cause.currentAmount || 0) / (cause.targetAmount || 1)
                const progressPercent = Math.min(Math.round(progress * 100), 100)

                return (
                  <div
                    key={cause.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedCause(cause)}
                  >
                    {cause.image && (
                      <img src={cause.image} alt={cause.name} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-5">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                        {cause.category}
                      </span>
                      <h3 className="text-lg font-bold mb-2">{cause.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{cause.description}</p>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold">AED {(cause.currentAmount || 0).toLocaleString()}</span>
                          <span className="text-gray-600">AED {(cause.targetAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{progressPercent}% funded</p>
                      </div>

                      <button
                        onClick={() => setSelectedCause(cause)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold flex items-center justify-center gap-2"
                      >
                        Donate <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Donation Modal / Details */}
        {selectedCause && partners.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  Donate to: {selectedCause.name}
                </h2>
                <p className="text-gray-600 mt-2">{selectedCause.description}</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Charity Partners */}
                <div>
                  <h3 className="text-lg font-bold mb-3">Select Payment Method</h3>
                  <p className="text-gray-600 mb-4">
                    You will be redirected to our official partner for secure payment processing. After completing your
                    donation, you&apos;ll be able to track it in your dashboard and receive a tax receipt.
                  </p>

                  <div className="space-y-3">
                    {partners.map((partner) => (
                      <a
                        key={partner.id}
                        href={`/donate-confirm?partner=${partner.id}&cause=${selectedCause.id}&partnerName=${encodeURIComponent(partner.name)}&paymentLink=${encodeURIComponent(partner.paymentLink)}&causeName=${encodeURIComponent(selectedCause.name)}`}
                        className="block border rounded-lg p-4 hover:bg-blue-50 hover:border-blue-500 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold">{partner.name}</h4>
                            <p className="text-sm text-gray-600">{partner.description}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-blue-600" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Info about process */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h4 className="font-bold text-blue-900 mb-2">How it Works:</h4>
                  <ol className="text-sm text-blue-900 space-y-1 list-decimal list-inside">
                    <li>Select a partner and you&apos;ll be redirected to complete payment</li>
                    <li>Return to your dashboard to upload payment proof</li>
                    <li>Our team verifies your submission within 24 hours</li>
                    <li>Your donation is recorded and you receive a tax receipt</li>
                  </ol>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <button
                  onClick={() => setSelectedCause(null)}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Is my donation secure?</h3>
              <p className="text-gray-700">
                Yes. All donations are processed through verified, regulated charitable partners. Passive Blessings does
                not handle funds directly, ensuring maximum transparency and security.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">When will my donation be recorded?</h3>
              <p className="text-gray-700">
                After you complete payment with our partner, return to your dashboard to upload proof. Our verification
                team processes submissions within 24 hours. Once verified, your donation is recorded immediately.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">What payment methods are accepted?</h3>
              <p className="text-gray-700">
                Payment methods depend on the selected charitable partner. Each partner offers multiple secure payment
                options including credit cards, bank transfers, and digital wallets.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Can I track my donation&apos;s impact?</h3>
              <p className="text-gray-700">
                Absolutely. Your member dashboard shows all your donations, impact metrics, and links to detailed reports
                on how your contribution helped the cause.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Will I receive a tax receipt?</h3>
              <p className="text-gray-700">
                Yes. Tax-compliant receipts are generated automatically for all verified donations and are available in
                your dashboard for download and filing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
