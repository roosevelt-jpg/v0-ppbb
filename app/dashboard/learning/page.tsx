'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Video, FileText, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LearningPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [resources, setResources] = useState<any[]>([])
  const [workshops, setWorkshops] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch learning resources
    const resourcesUnsubscribe = onSnapshot(
      query(collection(db, 'resources')),
      (snapshot) => {
        setResources(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
      }
    )

    // Fetch workshops
    const workshopsUnsubscribe = onSnapshot(
      query(collection(db, 'workshops')),
      (snapshot) => {
        setWorkshops(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
        setLoading(false)
      }
    )

    return () => {
      resourcesUnsubscribe()
      workshopsUnsubscribe()
    }
  }, [])

  const filteredResources = filter === 'all' ? resources : resources.filter(r => r.type === filter)

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />
      case 'document':
        return <FileText className="w-5 h-5" />
      case 'workshop':
        return <Users className="w-5 h-5" />
      default:
        return <BookOpen className="w-5 h-5" />
    }
  }

  return (
    <>
      <MemberHeader
        title="Learning Center"
        subtitle="Access resources, workshops, and recordings"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="p-8 space-y-8">
        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'video', 'document', 'workshop'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Resources */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Learning Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getIcon(resource.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{resource.title}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{resource.duration || 'Self-paced'}</span>
                  <Button size="sm" variant="outline">Access</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Workshops */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Workshops</h2>
          <div className="space-y-4">
            {workshops.map((workshop) => (
              <Card key={workshop.id} className="p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{workshop.title}</h3>
                    <p className="text-sm text-muted-foreground">{workshop.description}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span>Instructor: {workshop.instructor}</span>
                      <span>Date: {new Date(workshop.date).toLocaleDateString()}</span>
                      <span>Participants: {workshop.participants || 0}</span>
                    </div>
                  </div>
                  <Button>Register</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Spiritual Development */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-xl font-bold mb-4">Spiritual Development</h2>
          <p className="text-muted-foreground mb-4">Enhance your spiritual growth through guided meditations, reflections, and community wisdom sharing.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {['Daily Meditations', 'Community Reflections', 'Wisdom Articles'].map((item) => (
              <Button key={item} variant="outline" className="justify-start">
                {item}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
