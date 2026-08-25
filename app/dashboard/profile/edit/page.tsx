'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { User } from '@/lib/types'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function ProfileEditPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<Partial<User> | null>(null)

  const SKILLS = ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching/Training', 'Medical/Health', 'Legal', 'Events Management', 'Media/PR', 'Logistics', 'Admin/Operations', 'Social work', 'Other']

  useEffect(() => {
    if (authLoading) return
    const fetchUser = async () => {
      try {
        if (!authUser?.id) {
          router.push('/login')
          return
        }

        const userDoc = await getDoc(doc(db, 'users', authUser.id))
        if (userDoc.exists()) {
          setUser({ id: authUser.id, ...userDoc.data() } as User)
        }
      } catch (err) {
        console.error('[v0] Error fetching user:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router, authLoading, authUser?.id])

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
        <p style={{ color: 'var(--muted-foreground)' }}>Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-red-600 dark:text-red-400">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--card)', paddingTop: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>Edit Profile</h1>
          <p style={{ fontSize: '1rem', color: 'var(--muted-foreground)' }}>Manage your personal information and preferences</p>
        </div>

        {error && (
          <div
            className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
            style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem' }}
          >
            <AlertCircle className="text-red-600 dark:text-red-400" style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
            <p className="text-red-800 dark:text-red-300" style={{ fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        {success && (
          <div
            className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"
            style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem' }}
          >
            <CheckCircle className="text-green-600 dark:text-green-400" style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
            <p className="text-green-800 dark:text-green-300" style={{ fontSize: '0.875rem' }}>{success}</p>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Personal Information */}
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Personal Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <input type="text" name="firstName" placeholder="First Name" value={user.firstName || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              <input type="text" name="lastName" placeholder="Last Name" value={user.lastName || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              <input type="email" name="email" placeholder="Email" value={user.email || ''} onChange={handleInputChange} disabled style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: 'var(--muted)', cursor: 'not-allowed' }} />
              <input type="tel" name="whatsappNumber" placeholder="WhatsApp Number" value={user.whatsappNumber || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Professional Information */}
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Professional Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <input type="text" name="profession" placeholder="Job Title" value={user.profession || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
              <input type="text" name="employer" placeholder="Employer / Company" value={user.employer || ''} onChange={handleInputChange} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>

            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SKILLS.map(skill => (
                <button key={skill} type="button" onClick={() => handleSkillToggle(skill)} style={{ padding: '0.5rem 1rem', backgroundColor: user.skills?.includes(skill) ? '#111111' : 'var(--card)', color: user.skills?.includes(skill) ? '#ffffff' : 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Location</h2>
            <textarea name="motivation" placeholder="Tell us about your motivation and interests..." value={user.motivation || ''} onChange={handleInputChange} style={{ width: '100%', padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'system-ui' }} />
          </div>

          {/* Volunteer Availability */}
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Volunteer Availability</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <input type="number" name="hoursPerMonth" placeholder="Hours per month" value={user.volunteerAvailability?.hoursPerMonth || ''} onChange={(e) => setUser(prev => prev ? { ...prev, volunteerAvailability: { ...prev.volunteerAvailability, hoursPerMonth: parseInt(e.target.value) } } : null)} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '1rem', backgroundColor: saving ? 'var(--muted)' : '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.back()} style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
