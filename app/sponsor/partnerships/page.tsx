'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, MessageSquare, Handshake, Globe, Mail, Phone, Link as LinkIcon } from 'lucide-react'

export default function PartnershipsPage() {
  const { user } = useAuth()
  const [partnerships, setPartnerships] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user?.id) return

    const unsubscribe = onSnapshot(
      query(collection(db, 'sponsorships'), where('sponsorId', '==', user.id)),
      async snapshot => {
        const sponsorships = snapshot.docs.map(doc => doc.data())

        // Group by organization to create partnerships
        const partnerMap = new Map<string, any>()
        sponsorships.forEach(sponsorship => {
          if (!partnerMap.has(sponsorship.targetName)) {
            partnerMap.set(sponsorship.targetName, {
              id: sponsorship.targetId,
              name: sponsorship.targetName,
              type: sponsorship.type,
              totalSponsored: 0,
              activeSponsorships: 0,
              completedSponsorships: 0,
              lastSponsorship: sponsorship.createdAt,
            })
          }

          const partner = partnerMap.get(sponsorship.targetName)
          partner.totalSponsored += sponsorship.amount || 0
          if (sponsorship.status === 'active') partner.activeSponsorships++
          if (sponsorship.status === 'completed') partner.completedSponsorships++
          if (new Date(sponsorship.createdAt) > new Date(partner.lastSponsorship)) {
            partner.lastSponsorship = sponsorship.createdAt
          }
        })

        setPartnerships(Array.from(partnerMap.values()))
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.id])

  const stats = {
    totalPartners: partnerships.length,
    activePartnerships: partnerships.filter(p => p.activeSponsorships > 0).length,
    totalCollaborations: partnerships.reduce((sum, p) => sum + p.activeSponsorships + p.completedSponsorships, 0),
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-neutral-600">Loading partnerships...</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Strategic Partnerships</h1>
          <p className="text-neutral-600 mt-1">Manage and grow your sponsorship relationships</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Total Partners</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalPartners}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Active Partnerships</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.activePartnerships}</p>
              </div>
              <Handshake className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium">Collaborations</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalCollaborations}</p>
              </div>
              <Handshake className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Partners List */}
        {partnerships.length === 0 ? (
          <Card className="p-12 border border-neutral-200 text-center">
            <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">No partnerships yet</p>
            <p className="text-sm text-neutral-500 mb-6">
              Start sponsoring opportunities to build partnerships with organizations
            </p>
            <a href="/sponsor/marketplace">
              <Button>Browse Opportunities</Button>
            </a>
          </Card>
        ) : (
          <div className="space-y-6">
            {partnerships.map(partner => (
              <Card key={partner.id} className="p-6 border border-neutral-200 hover:shadow-lg transition">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Organization Info */}
                  <div className="md:col-span-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                      <Globe className="w-8 h-8 text-white opacity-50" />
                    </div>
                    <h3 className="font-bold text-neutral-900 mb-2">{partner.name}</h3>
                    <Badge variant="outline" className="capitalize">
                      {partner.type}
                    </Badge>
                  </div>

                  {/* Partnership Stats */}
                  <div className="md:col-span-1">
                    <p className="text-xs text-neutral-600 mb-1">Total Sponsored</p>
                    <p className="text-2xl font-bold text-neutral-900 mb-3">
                      AED {partner.totalSponsored.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {partner.activeSponsorships + partner.completedSponsorships} sponsorships
                    </p>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1">
                    <p className="text-xs text-neutral-600 mb-1">Status</p>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-neutral-700">Active: </span>
                        <span className="font-bold text-blue-600">{partner.activeSponsorships}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-neutral-700">Completed: </span>
                        <span className="font-bold text-green-600">{partner.completedSponsorships}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex flex-col justify-center gap-2">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm">
                      <MessageSquare className="w-4 h-4" />
                      Contact
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition font-medium text-sm">
                      <Handshake className="w-4 h-4" />
                      Details
                    </button>
                  </div>
                </div>

                {/* Last Sponsorship */}
                <div className="mt-6 pt-6 border-t border-neutral-200 text-xs text-neutral-600">
                  Last sponsorship:{' '}
                  {new Date(partner.lastSponsorship).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Collaboration Tools */}
        <Card className="p-8 border border-neutral-200 mt-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Partnership Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <Mail className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-neutral-900 mb-2">Send Partnership Proposals</h3>
              <p className="text-sm text-neutral-700 mb-4">
                Reach out to organizations with custom partnership opportunities
              </p>
              <Button variant="outline" className="w-full">
                Create Proposal
              </Button>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <MessageSquare className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-bold text-neutral-900 mb-2">Schedule Meetings</h3>
              <p className="text-sm text-neutral-700 mb-4">
                Arrange partnership discussions with organization leaders
              </p>
              <Button variant="outline" className="w-full">
                Schedule Meeting
              </Button>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <Handshake className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold text-neutral-900 mb-2">Partnership Agreements</h3>
              <p className="text-sm text-neutral-700 mb-4">
                Create and manage formal partnership agreements
              </p>
              <Button variant="outline" className="w-full">
                Manage Agreements
              </Button>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
              <Users className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="font-bold text-neutral-900 mb-2">Find New Partners</h3>
              <p className="text-sm text-neutral-700 mb-4">
                Discover organizations aligned with your sponsorship goals
              </p>
              <Button variant="outline" className="w-full">
                Find Partners
              </Button>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  )
}
