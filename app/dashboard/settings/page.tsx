'use client'

import React from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@/lib/types'

export default function SettingsPage() {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState(false)
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    skills: [] as string[],
  })

  React.useEffect(() => {
    const fetchUser = async () => {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) return

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data() as User
          setUser(userData)
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || '',
            location: userData.location || '',
            skills: userData.skills || [],
          })
        }
      } catch (error) {
        console.error('[v0] Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleSaveProfile = async () => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: formData.location,
        skills: formData.skills,
        updatedAt: new Date(),
      })
      setEditing(false)
    } catch (error) {
      console.error('[v0] Error updating profile:', error)
    }
  }

  return (
    <>
      <MemberHeader
        title="Profile Settings"
        subtitle="Manage your account and preferences"
      />
      
      <div className="p-8">
        <div className="max-w-2xl">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Personal Information</h2>
            
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{user?.firstName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{user?.lastName || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{user?.phone || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{user?.location || '-'}</p>
                </div>

                <Button onClick={() => setEditing(true)} className="mt-4">Edit Profile</Button>
              </div>
            )}
          </Card>

          <Card className="p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Membership</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tier</span>
                <span className="font-medium capitalize">{user?.membershipTier || 'Standard'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="font-medium">
                  {user?.memberSince ? new Date(user.memberSince).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
