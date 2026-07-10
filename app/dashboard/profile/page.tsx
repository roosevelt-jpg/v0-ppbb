'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { User } from '@/lib/types'
import { AlertCircle, CheckCircle } from 'lucide-react'

const SKILLS = ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching/Training', 'Medical/Health', 'Legal', 'Events Management', 'Media/PR', 'Logistics', 'Admin/Operations', 'Social work', 'Other']
const DEPARTMENTS = ['Community Support', 'Event Management', 'Volunteer Training', 'Fundraising', 'Administration', 'Marketing', 'Operations']

export default function ProfileEditPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<Partial<User>>({})

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
          const userData = userDoc.data() as User
          setUser(userData)
          setFormData(userData)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...(prev.skills || []), skill]
    }))
  }

  const handleVolunteerDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      volunteerAvailability: {
        days: ((prev?.volunteerAvailability?.days as string[]) || []).includes(day)
          ? (prev?.volunteerAvailability?.days as string[]).filter(d => d !== day)
          : [...((prev?.volunteerAvailability?.days as string[]) || []), day],
        hoursPerMonth: prev?.volunteerAvailability?.hoursPerMonth || 0,
        preferredDepartment: prev?.volunteerAvailability?.preferredDepartment,
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      if (!authUser?.id) {
        setError('Not authenticated')
        return
      }

      await setDoc(
        doc(db, 'users', authUser.id),
        {
          ...formData,
          id: authUser.id,
          updatedAt: new Date(),
        },
        { merge: true }
      )

      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err: any) {
      console.error('[v0] Error saving profile:', err)
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#111' }}>Edit Profile</h1>

      {error && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', flexShrink: 0 }} />
          <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>{error}</p>
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a', flexShrink: 0 }} />
          <p style={{ fontSize: '0.875rem', color: '#166534' }}>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Personal Information */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111' }}>Personal Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>First Name</label>
              <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Middle Name</label>
              <input type="text" name="middleName" value={formData.middleName || ''} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Last Name</label>
              <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Gender</label>
              <select name="gender" value={formData.gender || ''} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Nationality</label>
              <input type="text" name="nationality" value={formData.nationality || ''} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111' }}>Contact Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Email</label>
              <input type="email" value={formData.email || ''} disabled style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: '#f7f6f2', color: '#999' }} />
              <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>Email cannot be changed</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>WhatsApp Number</label>
              <input type="tel" name="whatsappNumber" value={formData.whatsappNumber || ''} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          </div>
        </section>

        {/* Professional Information */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111' }}>Professional Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Job Title / Occupation</label>
              <input type="text" name="profession" value={formData.profession || ''} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Employer / Company</label>
              <input type="text" name="employer" value={formData.employer || ''} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111' }}>Skills</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: (formData.skills || []).includes(skill) ? '#111111' : '#f7f6f2',
                    color: (formData.skills || []).includes(skill) ? '#ffffff' : '#111111',
                    border: 'none',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Volunteer Information */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111' }}>Volunteer Information</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111' }}>Available Days</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['Weekdays', 'Weekends', 'Flexible'].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleVolunteerDayToggle(day)}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: (formData.volunteerAvailability?.days || []).includes(day) ? '#111111' : '#f7f6f2',
                    color: (formData.volunteerAvailability?.days || []).includes(day) ? '#ffffff' : '#111111',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Hours Per Month</label>
              <input type="number" value={formData.volunteerAvailability?.hoursPerMonth || ''} onChange={(e) => setFormData(prev => ({ ...prev, volunteerAvailability: { ...prev.volunteerAvailability, hoursPerMonth: parseInt(e.target.value) || 0 } }))} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111' }}>Preferred Department</label>
              <select value={formData.volunteerAvailability?.preferredDepartment || ''} onChange={(e) => setFormData(prev => ({ ...prev, volunteerAvailability: { ...prev.volunteerAvailability, preferredDepartment: e.target.value } }))} style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f7f6f2', color: '#111111', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={{ padding: '0.75rem 1.5rem', backgroundColor: saving ? '#cccccc' : '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
