'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, Download, Share2, Eye, Filter } from 'lucide-react'

export default function CertificatesPage() {
  const { user } = useAuth()
  const [certificates, setCertificates] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filterStatus, setFilterStatus] = React.useState('all')

  React.useEffect(() => {
    if (!user?.id) return

    // Mock certificates from completed sponsorships
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'sponsorships'),
        where('sponsorId', '==', user.id),
        where('status', '==', 'completed')
      ),
      snapshot => {
        const data = snapshot.docs.map((doc, idx) => ({
          id: doc.id,
          ...doc.data(),
          certificateIssued: idx % 2 === 0, // Mock some as issued
          issuedDate: idx % 2 === 0 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        }))

        setCertificates(data)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.id])

  const filteredCertificates = certificates.filter(cert => {
    if (filterStatus === 'issued') return cert.certificateIssued
    if (filterStatus === 'pending') return !cert.certificateIssued
    return true
  })

  const stats = {
    totalCertificates: certificates.filter(c => c.certificateIssued).length,
    pendingCertificates: certificates.filter(c => !c.certificateIssued).length,
    recognitionPoints: certificates.filter(c => c.certificateIssued).length * 100,
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-neutral-600">Loading certificates...</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Sponsorship Recognition</h1>
          <p className="text-neutral-600 mt-1">View your certificates and recognition achievements</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Certificates Earned</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalCertificates}</p>
              </div>
              <Award className="w-10 h-10 text-amber-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Recognition Points</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.recognitionPoints}</p>
                <p className="text-xs text-neutral-500 mt-1">Points earned</p>
              </div>
              <Award className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Pending Recognition</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.pendingCertificates}</p>
                <p className="text-xs text-neutral-500 mt-1">Under review</p>
              </div>
              <Award className="w-10 h-10 text-gray-400 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All Certificates' },
            { value: 'issued', label: 'Issued' },
            { value: 'pending', label: 'Pending' },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filterStatus === filter.value
                  ? 'bg-black text-white'
                  : 'bg-white border border-neutral-300 text-neutral-700 hover:border-black'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <Card className="p-12 border border-neutral-200 text-center">
            <Award className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">
              {filterStatus === 'issued'
                ? 'No issued certificates yet'
                : filterStatus === 'pending'
                  ? 'No pending certificates'
                  : 'No certificates yet'}
            </p>
            <p className="text-sm text-neutral-500">
              Complete sponsorships to earn recognition certificates
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map(cert => (
              <Card
                key={cert.id}
                className="border border-neutral-200 overflow-hidden hover:shadow-lg transition flex flex-col"
              >
                {/* Certificate Preview */}
                <div className="h-48 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center p-6 border-b border-neutral-200">
                  <div className="text-center">
                    <Award className="w-16 h-16 text-amber-600 mx-auto mb-2" />
                    <p className="font-bold text-amber-900 text-sm">Certificate of Recognition</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-neutral-900 mb-1">{cert.title}</h3>
                  <p className="text-sm text-neutral-600 mb-4">{cert.targetName}</p>

                  {/* Status and Amount */}
                  <div className="mb-4 pb-4 border-b border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-600">Amount Sponsored</span>
                      <Badge variant="secondary">AED {cert.amount.toLocaleString()}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Status</span>
                      <Badge className={cert.certificateIssued ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                        {cert.certificateIssued ? 'Issued' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {/* Issued Date or Message */}
                  {cert.certificateIssued && cert.issuedDate && (
                    <p className="text-xs text-neutral-500 mb-4">
                      Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                    </p>
                  )}

                  {!cert.certificateIssued && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mb-4">
                      Certificate will be issued upon completion of the project
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    {cert.certificateIssued && (
                      <>
                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-black border border-black rounded-lg hover:bg-neutral-50 transition text-sm font-medium">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition text-sm font-medium">
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </>
                    )}
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recognition Levels */}
        <Card className="p-8 border border-neutral-200 mt-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Recognition Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { level: 'Emerging Sponsor', points: 100, description: '1-2 sponsorships' },
              { level: 'Active Sponsor', points: 300, description: '3-5 sponsorships' },
              { level: 'Platinum Sponsor', points: 600, description: '6-10 sponsorships' },
              { level: 'Elite Sponsor', points: 1000, description: '10+ sponsorships' },
            ].map((tier, idx) => {
              const isUnlocked = stats.totalCertificates >= idx + 1
              return (
                <div
                  key={tier.level}
                  className={`p-6 rounded-lg border-2 transition ${
                    isUnlocked
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-neutral-50 border-neutral-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-center mb-3">
                    <Award className={`w-8 h-8 ${isUnlocked ? 'text-amber-600' : 'text-neutral-400'}`} />
                  </div>
                  <h3 className={`font-bold text-center mb-2 ${isUnlocked ? 'text-amber-900' : 'text-neutral-700'}`}>
                    {tier.level}
                  </h3>
                  <p className={`text-sm text-center mb-2 ${isUnlocked ? 'text-amber-800' : 'text-neutral-600'}`}>
                    {tier.points} points
                  </p>
                  <p className={`text-xs text-center ${isUnlocked ? 'text-amber-700' : 'text-neutral-600'}`}>
                    {tier.description}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
