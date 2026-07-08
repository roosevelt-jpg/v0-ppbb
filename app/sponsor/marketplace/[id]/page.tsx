'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Users, Target, Calendar, Share2, Heart, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function MarketplaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const opportunityId = params.id as string

  const [opportunity, setOpportunity] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [applying, setApplying] = React.useState(false)
  const [applied, setApplied] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [sponsorshipAmount, setSponsorshipAmount] = React.useState('')
  const [sponsorshipMessage, setSponsorshipMessage] = React.useState('')

  React.useEffect(() => {
    if (!opportunityId) return

    const fetchOpportunity = async () => {
      try {
        // Try causes first
        let docRef = doc(db, 'causes', opportunityId)
        let docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          // Try events
          docRef = doc(db, 'events', opportunityId)
          docSnap = await getDoc(docRef)
        }

        if (!docSnap.exists()) {
          // Try charity
          docRef = doc(db, 'charity', opportunityId)
          docSnap = await getDoc(docRef)
        }

        if (docSnap.exists()) {
          setOpportunity({
            id: docSnap.id,
            ...docSnap.data(),
          })

          // Check if sponsor already applied
          if (user?.id) {
            const appliedSnap = await getDocs(
              query(
                collection(db, 'sponsorships'),
                where('sponsorId', '==', user.id),
                where('targetId', '==', opportunityId)
              )
            )
            setApplied(appliedSnap.docs.length > 0)
          }
        }
      } catch (err) {
        console.error('[v0] Error fetching opportunity:', err)
        setError('Failed to load opportunity')
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunity()
  }, [opportunityId, user?.id])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !sponsorshipAmount) return

    setApplying(true)
    setError('')
    setSuccess('')

    try {
      const sponsorProfile = await getDoc(doc(db, 'users', user.id))
      const sponsorData = sponsorProfile.data()

      await addDoc(collection(db, 'sponsorships'), {
        sponsorId: user.id,
        sponsorName: sponsorData?.sponsorName || user.name,
        type: opportunity.type || 'campaign',
        title: opportunity.title,
        description: sponsorshipMessage,
        amount: parseInt(sponsorshipAmount),
        currency: 'AED',
        status: 'pending',
        targetId: opportunityId,
        targetName: opportunity.title,
        impactArea: opportunity.category,
        visibilityLevel: 'public',
        startDate: new Date(),
        benefits: [],
        recognition: true,
        certificateIssued: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      setSuccess('Sponsorship application submitted! We will review and get back to you shortly.')
      setApplied(true)
      setTimeout(() => {
        setSponsorshipAmount('')
        setSponsorshipMessage('')
      }, 2000)
    } catch (err) {
      console.error('[v0] Error submitting application:', err)
      setError('Failed to submit application. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-neutral-600">Loading opportunity...</div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="p-8 bg-neutral-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Link href="/sponsor/marketplace">
            <Button variant="ghost" className="mb-8">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <Card className="p-12 border border-neutral-200 text-center">
            <p className="text-neutral-600">Opportunity not found</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link href="/sponsor/marketplace">
          <Button variant="ghost" className="mb-8">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Placeholder */}
            <Card className="h-64 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border border-neutral-200">
              <div className="text-white text-center">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{opportunity.type}</p>
              </div>
            </Card>

            {/* Title and Type */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline">{opportunity.type}</Badge>
                {opportunity.category && <Badge variant="secondary">{opportunity.category}</Badge>}
              </div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">{opportunity.title}</h1>
              <p className="text-neutral-600">{opportunity.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-6 border-y border-neutral-200">
              {opportunity.targetAmount && (
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Target Amount</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    AED {opportunity.targetAmount.toLocaleString()}
                  </p>
                </div>
              )}
              {opportunity.participantCount && (
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Participants</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-neutral-400" />
                    <p className="text-2xl font-bold text-neutral-900">{opportunity.participantCount}</p>
                  </div>
                </div>
              )}
              {opportunity.status && (
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Status</p>
                  <Badge className="capitalize">{opportunity.status}</Badge>
                </div>
              )}
            </div>

            {/* Detailed Description */}
            {opportunity.longDescription && (
              <Card className="p-6 border border-neutral-200">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">About This Opportunity</h2>
                <p className="text-neutral-700 leading-relaxed">{opportunity.longDescription}</p>
              </Card>
            )}

            {/* Impact Information */}
            {opportunity.impact && (
              <Card className="p-6 border border-neutral-200">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Expected Impact</h2>
                <p className="text-neutral-700">{opportunity.impact}</p>
              </Card>
            )}
          </div>

          {/* Sidebar - Application Form */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6 border border-neutral-200">
              <h3 className="font-bold text-neutral-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                {opportunity.createdAt && (
                  <div className="flex items-center gap-3 text-sm text-neutral-700">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span>Posted {new Date(opportunity.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                {opportunity.location && (
                  <div className="text-sm text-neutral-700">
                    <span className="font-medium">Location:</span> {opportunity.location}
                  </div>
                )}
              </div>
            </Card>

            {/* Application Form */}
            {applied ? (
              <Card className="p-6 border border-green-200 bg-green-50">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-green-900">Application Submitted</h3>
                    <p className="text-sm text-green-800 mt-2">
                      Your sponsorship application has been submitted. The organization will contact you soon.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border border-neutral-200 sticky top-8">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Sponsor This Opportunity</h3>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                )}

                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Sponsorship Amount (AED) *
                    </label>
                    <input
                      type="number"
                      value={sponsorshipAmount}
                      onChange={e => setSponsorshipAmount(e.target.value)}
                      required
                      min="1000"
                      step="1000"
                      placeholder="10000"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Minimum 1,000 AED</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Message (Optional)</label>
                    <textarea
                      value={sponsorshipMessage}
                      onChange={e => setSponsorshipMessage(e.target.value)}
                      rows={4}
                      placeholder="Tell us about your sponsorship goals and why you want to support this opportunity..."
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={applying || !sponsorshipAmount}
                    className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition font-medium"
                  >
                    {applying ? 'Submitting...' : 'Submit Sponsorship'}
                  </button>

                  <button
                    type="button"
                    className="w-full px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Save for Later
                  </button>
                </form>
              </Card>
            )}

            {/* Share */}
            <Card className="p-6 border border-neutral-200">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition">
                <Share2 className="w-4 h-4" />
                Share This Opportunity
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
