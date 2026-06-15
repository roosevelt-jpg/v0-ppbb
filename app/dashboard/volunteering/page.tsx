'use client'

export const dynamic = 'force-dynamic'
import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Award, Target } from 'lucide-react'

export default function VolunteeringPage() {
  const [volunteering, setVolunteering] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    // Fetch volunteer profile
    const volunteerUnsubscribe = onSnapshot(
      query(collection(db, 'volunteerProfiles'), where('userId', '==', firebaseUser.uid)),
      (snapshot) => {
        if (!snapshot.empty) {
          setVolunteering(snapshot.docs[0].data())
        }
      }
    )

    // Fetch volunteer applications
    const applicationsUnsubscribe = onSnapshot(
      query(collection(db, 'volunteerApplications'), where('volunteerId', '==', firebaseUser.uid)),
      (snapshot) => {
        setApplications(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
        setLoading(false)
      }
    )

    return () => {
      volunteerUnsubscribe()
      applicationsUnsubscribe()
    }
  }, [])

  const totalHours = volunteering?.totalHours || 0
  const volunteersSince = volunteering?.enrolledAt
    ? new Date(volunteering.enrolledAt).toLocaleDateString()
    : 'Not enrolled'

  return (
    <div style={{ padding: "0" }}>
            <div className="p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-3xl font-bold">{totalHours}</p>
              </div>
              <Clock size={32} className="text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Applications</p>
                <p className="text-3xl font-bold">{applications.length}</p>
              </div>
              <Target size={32} className="text-orange-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volunteer Since</p>
                <p className="text-sm font-medium">{volunteersSince}</p>
              </div>
              <Award size={32} className="text-green-500" />
            </div>
          </Card>
        </div>

        {/* Volunteer Applications */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Your Applications</h2>

          {applications.length === 0 ? (
            <p className="text-muted-foreground">No volunteer applications yet</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold">{app.eventName || app.opportunityName}</h3>
                    <p className="text-sm text-muted-foreground">{app.department}</p>
                    <div className="flex gap-2 mt-2">
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor:
                            app.status === 'approved'
                              ? '#e8f5e9'
                              : app.status === 'pending'
                                ? '#fff3e0'
                                : '#ffebee',
                          color:
                            app.status === 'approved'
                              ? '#2e7d32'
                              : app.status === 'pending'
                                ? '#e65100'
                                : '#c62828',
                        }}
                      >
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                      {app.hoursLogged && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-black rounded">
                          {app.hoursLogged} hours logged
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Navigate to application details
                      console.log('View details for:', app.id)
                    }}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Volunteer Profile Info */}
        {volunteering && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Your Volunteer Profile</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Department Focus</p>
                <p className="font-medium">{volunteering.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skills</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {volunteering.skills?.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 text-xs bg-gray-200 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Availability</p>
                <p className="font-medium">{volunteering.availability}</p>
              </div>
            </div>
          </Card>
        )}
      </div>    </div>
  )
}
