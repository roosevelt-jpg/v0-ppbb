'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@/lib/types'

export default function SettingsPage() {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
    skills: [] as string[],
    departments: [] as string[],
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
            bio: userData.bio || '',
            skills: userData.skills || [],
            departments: userData.departments || [],
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

    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        skills: formData.skills,
        departments: formData.departments,
        updatedAt: new Date(),
      })
      setUser({...user, ...formData} as User)
      setEditing(false)
    } catch (error) {
      console.error('[v0] Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: "0" }}>
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

                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us about yourself"
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills.join(', ')}
                    onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="e.g., Teaching, Cooking, Programming"
                    className="w-full mt-1 px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Interested Departments (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.departments.join(', ')}
                    onChange={(e) => setFormData({...formData, departments: e.target.value.split(',').map(d => d.trim())})}
                    placeholder="e.g., Education, Healthcare, Community Service"
                    className="w-full mt-1 px-3 py-2 border rounded"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
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

                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="font-medium">{user?.bio || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Skills</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user?.skills && user.skills.length > 0 ? (
                      user.skills.map((skill: string) => (
                        <span key={skill} className="px-3 py-1 bg-gray-100 text-black rounded-full text-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No skills added</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Interested Departments</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user?.departments && user.departments.length > 0 ? (
                      user.departments.map((dept: string) => (
                        <span key={dept} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {dept}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No departments selected</p>
                    )}
                  </div>
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
      </div>    </div>
  )
}
