'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { User } from '@/lib/types'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<Partial<User> | null>(null)

  const SKILLS = ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching/Training', 'Medical/Health', 'Legal', 'Events Management', 'Media/PR', 'Logistics', 'Admin/Operations', 'Social work', 'Other']

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) {
          router.push('/login')
          return
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          setUser({ id: currentUser.uid, ...userDoc.data() as User })
        }
      } catch (err) {
        console.error('[v0] Error fetching user:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setUser(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleSkillToggle = (skill: string) => {
    setUser(prev => {
      if (!prev) return null
      const skills = prev.skills || []
      return {
        ...prev,
        skills: skills.includes(skill) ? skills.filter(s => s !== skill) : [...skills, skill]
      }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !user.id) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await setDoc(doc(db, 'users', user.id), {
        ...user,
        updatedAt: new Date()
      }, { merge: true })

      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error saving profile:', err)
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666' }}>Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#dc2626' }}>Failed to load profile</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', paddingTop: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#111111', marginBottom: '0.5rem' }}>Edit Profile</h1>
          <p style={{ fontSize: '1rem', color: '#666' }}>Manage your personal information and preferences</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem' }}>
            <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', flexShrink: 0 }} />
            <p style={{ color: '#991b1b', fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        {success && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem' }}>
            <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a', flexShrink: 0 }} />
            <p style={{ color: '#166534', fontSize: '0.875rem' }}>{success}</p>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Personal Information */}
          <div style={{ padding: '1.5rem', backgroundColor: '#f7f6f2', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111111' }}>Personal Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <input type="text" name="firstName" placeholder="First Name" value={user.firstName || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              <input type="text" name="lastName" placeholder="Last Name" value={user.lastName || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              <input type="email" name="email" placeholder="Email" value={user.email || ''} onChange={handleInputChange} disabled style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} />
              <input type="tel" name="whatsappNumber" placeholder="WhatsApp Number" value={user.whatsappNumber || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Professional Information */}
          <div style={{ padding: '1.5rem', backgroundColor: '#f7f6f2', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111111' }}>Professional Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <input type="text" name="profession" placeholder="Job Title" value={user.profession || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              <input type="text" name="employer" placeholder="Employer / Company" value={user.employer || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>

            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111' }}>Skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SKILLS.map(skill => (
                <button key={skill} type="button" onClick={() => handleSkillToggle(skill)} style={{ padding: '0.5rem 1rem', backgroundColor: user.skills?.includes(skill) ? '#111111' : '#ffffff', color: user.skills?.includes(skill) ? '#ffffff' : '#111111', border: '1px solid #e4e1da', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div style={{ padding: '1.5rem', backgroundColor: '#f7f6f2', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111111' }}>Location</h2>
            <textarea name="motivation" placeholder="Tell us about your motivation and interests..." value={user.motivation || ''} onChange={handleInputChange} style={{ width: '100%', padding: '1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'system-ui' }} />
          </div>

          {/* Volunteer Availability */}
          <div style={{ padding: '1.5rem', backgroundColor: '#f7f6f2', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111111' }}>Volunteer Availability</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <input type="number" name="hoursPerMonth" placeholder="Hours per month" value={user.volunteerAvailability?.hoursPerMonth || ''} onChange={(e) => setUser(prev => prev ? { ...prev, volunteerAvailability: { ...prev.volunteerAvailability, hoursPerMonth: parseInt(e.target.value) } } : null)} style={{ padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '1rem', backgroundColor: saving ? '#cccccc' : '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: '1rem', backgroundColor: '#ffffff', color: '#111111', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
