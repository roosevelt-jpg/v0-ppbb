'use client'

import React from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Heart, Share2, TrendingUp, Target, Users } from 'lucide-react'
import Link from 'next/link'

export default function SponsorMarketplacePage() {
  const [opportunities, setOpportunities] = React.useState<any[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState('all')
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set())

  const typeOptions = [
    { value: 'all', label: 'All Opportunities' },
    { value: 'campaign', label: 'Campaigns' },
    { value: 'event', label: 'Events' },
    { value: 'charity', label: 'Charity Cases' },
    { value: 'project', label: 'Projects' },
  ]

  React.useEffect(() => {
    // Fetch from causes, events, and charity collections
    const unsubscribeCauses = onSnapshot(collection(db, 'causes'), (snapshot) => {
      const causes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'campaign',
      }))
      setOpportunities(prev => [...prev.filter(o => o.type !== 'campaign'), ...causes])
    })

    return () => unsubscribeCauses()
  }, [])

  React.useEffect(() => {
    let filtered = opportunities

    if (typeFilter !== 'all') {
      filtered = filtered.filter(o => o.type === typeFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        o =>
          o.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredOpportunities(filtered)
    setLoading(false)
  }, [opportunities, searchTerm, typeFilter])

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Sponsorship Opportunities</h1>
          <p className="text-neutral-600 mt-1">Discover and support campaigns, events, and charitable causes</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {typeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setTypeFilter(option.value)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  typeFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:border-blue-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-neutral-600">
          Showing {filteredOpportunities.length} opportunity
          {filteredOpportunities.length !== 1 ? 'ies' : ''}
        </div>

        {/* Opportunities Grid */}
        {filteredOpportunities.length === 0 ? (
          <Card className="p-12 border border-neutral-200 text-center">
            <p className="text-neutral-600 mb-4">No opportunities found matching your criteria</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map(opportunity => (
              <Card
                key={opportunity.id}
                className="border border-neutral-200 overflow-hidden hover:shadow-lg transition"
              >
                {/* Header Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">{opportunity.type}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary">{opportunity.type}</Badge>
                    <button
                      onClick={() => toggleSave(opportunity.id)}
                      className={`p-2 rounded-lg transition ${
                        savedIds.has(opportunity.id)
                          ? 'bg-red-50 text-red-600'
                          : 'bg-neutral-50 text-neutral-400 hover:text-neutral-600'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${savedIds.has(opportunity.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 mb-2 line-clamp-2">
                    {opportunity.title}
                  </h3>

                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                    {opportunity.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-neutral-200">
                    {opportunity.targetAmount && (
                      <div>
                        <p className="text-xs text-neutral-600">Target Amount</p>
                        <p className="text-lg font-bold text-neutral-900">
                          AED {(opportunity.targetAmount / 1000).toFixed(0)}K
                        </p>
                      </div>
                    )}
                    {opportunity.participantCount && (
                      <div>
                        <p className="text-xs text-neutral-600">Participants</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-4 h-4 text-neutral-400" />
                          <p className="text-lg font-bold text-neutral-900">{opportunity.participantCount}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link href={`/sponsor/marketplace/${opportunity.id}`} className="flex-1">
                      <Button className="w-full">View Details</Button>
                    </Link>
                    <button className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition">
                      <Share2 className="w-5 h-5 text-neutral-600" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
