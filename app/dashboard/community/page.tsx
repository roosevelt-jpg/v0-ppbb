'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, GraduationCap, Zap, Users } from 'lucide-react'

export default function CommunityPage() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'opportunities'), where('status', '==', 'active')),
      (snapshot) => {
        setOpportunities(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching opportunities:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filtered =
    filter === 'all'
      ? opportunities
      : opportunities.filter((opp) => opp.type === filter)

  const getIcon = (type: string) => {
    switch (type) {
      case 'job':
        return <Briefcase size={24} className="text-blue-500" />
      case 'internship':
        return <GraduationCap size={24} className="text-purple-500" />
      case 'gig':
        return <Zap size={24} className="text-orange-500" />
      case 'networking':
        return <Users size={24} className="text-green-500" />
      default:
        return <Briefcase size={24} className="text-gray-500" />
    }
  }

  return (
    <>
      <MemberHeader
        title="Community & Opportunities"
        subtitle="Discover jobs, internships, and networking opportunities"
      />

      <div className="p-8 space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'job', 'internship', 'gig', 'networking'].map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              onClick={() => setFilter(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Opportunities Grid */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading opportunities...</p>
          ) : filtered.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">No opportunities found</p>
            </Card>
          ) : (
            filtered.map((opportunity) => (
              <Card key={opportunity.id} className="p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    {getIcon(opportunity.type)}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg">{opportunity.title}</h3>
                        <span
                          className="text-xs px-2 py-1 rounded font-medium whitespace-nowrap"
                          style={{
                            backgroundColor:
                              opportunity.type === 'job'
                                ? '#e3f2fd'
                                : opportunity.type === 'internship'
                                  ? '#f3e5f5'
                                  : opportunity.type === 'gig'
                                    ? '#fff3e0'
                                    : '#e8f5e9',
                            color:
                              opportunity.type === 'job'
                                ? '#1976d2'
                                : opportunity.type === 'internship'
                                  ? '#7b1fa2'
                                  : opportunity.type === 'gig'
                                    ? '#e65100'
                                    : '#2e7d32',
                          }}
                        >
                          {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                        </span>
                      </div>

                      <p className="text-muted-foreground text-sm mt-1">{opportunity.organization}</p>
                      <p className="text-sm mt-2">{opportunity.description}</p>

                      <div className="flex gap-2 flex-wrap mt-3">
                        {opportunity.location && (
                          <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                            {opportunity.location}
                          </span>
                        )}
                        {opportunity.salary && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                            {opportunity.salary}
                          </span>
                        )}
                        {opportunity.deadline && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                            Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => console.log('Apply for:', opportunity.id)}>
                    Apply Now
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  )
}
