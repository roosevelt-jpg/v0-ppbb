'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { User } from '@/lib/types'
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { AdminUserProfileSummary } from '@/components/admin-user-profile-summary'
import { formatUserPhoneDisplay } from '@/lib/user-profile'
import { BUTTON_BACK } from '@/lib/admin-design-system'

const NOT_PROVIDED = 'Not provided'
const SKILLS = ['Tech/IT', 'Marketing', 'Design', 'Finance', 'Teaching/Training', 'Medical/Health', 'Legal', 'Events Management', 'Media/PR', 'Logistics', 'Admin/Operations', 'Social work', 'Other']
const DEPARTMENTS = ['Community Support', 'Event Management', 'Volunteer Training', 'Fundraising', 'Administration', 'Marketing', 'Operations']
const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  fontSize: '0.9375rem',
  boxSizing: 'border-box',
  backgroundColor: 'var(--input, var(--background))',
  color: 'var(--foreground)',
}

function formatOptionalDate(
  value: unknown,
  options?: Intl.DateTimeFormatOptions
): string {
  if (value == null || value === '') return NOT_PROVIDED
  try {
    let date: Date
    if (value instanceof Date) {
      date = value
    } else if (typeof value === 'object' && value !== null && 'toDate' in value) {
      date = (value as { toDate: () => Date }).toDate()
    } else {
      date = new Date(String(value))
    }
    if (Number.isNaN(date.getTime())) return NOT_PROVIDED
    return date.toLocaleDateString('en-US', options)
  } catch {
    return NOT_PROVIDED
  }
}


export default function AdminMemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [member, setMember] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<Partial<User>>({})

  useEffect(() => {
    const fetchMember = async () => {
      try {
        if (!userId) {
          setError('Member ID not found')
          return
        }

        const memberDoc = await getDoc(doc(db, 'users', userId))
        if (memberDoc.exists()) {
          const data = memberDoc.data() as User
          setMember(data)
          setFormData(data)
        } else {
          setError('Member not found')
        }
      } catch (err) {
        console.error('[v0] Error fetching member:', err)
        setError('Failed to load member details')
      } finally {
        setLoading(false)
      }
    }

    fetchMember()
  }, [userId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => {
      const skills = prev.skills || []
      return {
        ...prev,
        skills: skills.includes(skill) ? skills.filter((s) => s !== skill) : [...skills, skill],
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Explicit allowlist, never a blind spread of formData: this page
      // must not be able to write role/permissions/membership fields via
      // the client SDK, which Firestore rules only gate on isAdmin() (any
      // admin), bypassing the invite-permission scoping those fields
      // otherwise go through (see /api/members and /api/admin/management).
      await setDoc(
        doc(db, 'users', userId),
        {
          profession: formData.profession ?? null,
          employer: formData.employer ?? null,
          whatsappNumber: formData.whatsappNumber ?? null,
          location: formData.location ?? null,
          skills: formData.skills ?? [],
          volunteerAvailability: formData.volunteerAvailability ?? null,
          updatedAt: new Date(),
        },
        { merge: true }
      )

      setMember((prev) => (prev ? { ...prev, ...formData } : prev))
      setSuccess('Member details updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('[v0] Error saving member:', err)
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading member details...</div>
  }

  if (!member) {
    return (
      <div style={{ padding: '2rem' }}>
        <button
          type="button"
          onClick={() => router.back()}
          className={BUTTON_BACK}
          style={{ marginBottom: '1rem' }}
        >
          <ArrowLeft /> Back
        </button>
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900" style={{ padding: '1rem', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem' }}>
          <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-300">Member not found</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <button
        type="button"
        onClick={() => router.back()}
        className={BUTTON_BACK}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft /> Back to Members
      </button>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--foreground)' }}>
        Member profile
      </h1>

      <div style={{ marginBottom: '2rem' }}>
        <AdminUserProfileSummary user={member} />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={20} className="text-red-600 dark:text-red-400" style={{ flexShrink: 0 }} />
          <p className="text-red-800 dark:text-red-300" style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <CheckCircle size={20} className="text-green-600 dark:text-green-400" style={{ flexShrink: 0 }} />
          <p className="text-green-800 dark:text-green-300" style={{ fontSize: '0.875rem' }}>{success}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        {/* Member Info */}
        <section style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)', textTransform: 'uppercase' }}>Member Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Email</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>{member.email || NOT_PROVIDED}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Role</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500, textTransform: 'capitalize' }}>{member.role || NOT_PROVIDED}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Member Since</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>
                {formatOptionalDate(member.memberSince, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Status</p>
              <p
                className={member.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                style={{ fontSize: '1rem', fontWeight: 600 }}
              >
                {member.active === true ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)', textTransform: 'uppercase' }}>Activity Statistics</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Volunteered Hours</p>
              <p style={{ fontSize: '1.5rem', color: 'var(--foreground)', fontWeight: 700 }}>{member.volunteeredHours ?? 0}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Total Donated</p>
              <p style={{ fontSize: '1.5rem', color: 'var(--foreground)', fontWeight: 700 }}>AED {(member.totalDonated ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Membership Tier</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500, textTransform: 'capitalize' }}>{member.membershipTier || NOT_PROVIDED}</p>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)', textTransform: 'uppercase' }}>Contact Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Email</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500, wordBreak: 'break-all' }}>
                {member.email || 'Not provided'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Phone</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>{formatUserPhoneDisplay(member)}</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>WhatsApp</label>
              <input
                type="tel"
                name="whatsappNumber"
                value={formData.whatsappNumber || ''}
                onChange={handleInputChange}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>City</label>
              <input
                type="text"
                value={formData.location?.city || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    // `location`'s type resolves oddly due to a duplicate
                    // LocationData interface name elsewhere in lib/types.ts;
                    // the actual stored shape (used throughout this page) is
                    // the optional city/emirate/country one.
                    location: { ...(prev.location as any), city: e.target.value },
                  }))
                }
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>Emirate</label>
              <input
                type="text"
                value={formData.location?.emirate || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: { ...(prev.location as any), emirate: e.target.value },
                  }))
                }
                style={INPUT_STYLE}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Professional Info */}
      <section style={{ marginTop: '2rem', backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)', textTransform: 'uppercase' }}>Professional Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>Job Title</label>
            <input
              type="text"
              name="profession"
              value={formData.profession || ''}
              onChange={handleInputChange}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>Employer</label>
            <input
              type="text"
              name="employer"
              value={formData.employer || ''}
              onChange={handleInputChange}
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.75rem' }}>Skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SKILLS.map((skill) => {
                const active = (formData.skills || []).includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: active ? 'var(--foreground)' : 'var(--card)',
                      color: active ? 'var(--background)' : 'var(--foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Info */}
      <section style={{ marginTop: '2rem', backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)', textTransform: 'uppercase' }}>Volunteer Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.75rem' }}>Available Days</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['Weekdays', 'Weekends', 'Flexible'].map((day) => {
                const active = (formData.volunteerAvailability?.days || []).includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => {
                        const days = prev.volunteerAvailability?.days || []
                        return {
                          ...prev,
                          volunteerAvailability: {
                            hoursPerMonth: prev.volunteerAvailability?.hoursPerMonth || 0,
                            preferredDepartment: prev.volunteerAvailability?.preferredDepartment,
                            days: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
                          },
                        }
                      })
                    }
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: active ? 'var(--foreground)' : 'var(--card)',
                      color: active ? 'var(--background)' : 'var(--foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>Hours Per Month</label>
            <input
              type="number"
              value={formData.volunteerAvailability?.hoursPerMonth || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  volunteerAvailability: {
                    days: prev.volunteerAvailability?.days || [],
                    preferredDepartment: prev.volunteerAvailability?.preferredDepartment,
                    hoursPerMonth: parseInt(e.target.value, 10) || 0,
                  },
                }))
              }
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>Preferred Department</label>
            <select
              value={formData.volunteerAvailability?.preferredDepartment || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  volunteerAvailability: {
                    days: prev.volunteerAvailability?.days || [],
                    hoursPerMonth: prev.volunteerAvailability?.hoursPerMonth || 0,
                    preferredDepartment: e.target.value,
                  },
                }))
              }
              style={INPUT_STYLE}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            minHeight: '44px',
            backgroundColor: saving ? 'var(--muted)' : 'var(--foreground)',
            color: 'var(--background)',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Consents */}
      <section style={{ marginTop: '2rem', backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)', textTransform: 'uppercase' }}>Consents</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Terms & Conditions</p>
            <p
              className={member.consentTerms ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              style={{ fontSize: '0.875rem', fontWeight: 600 }}
            >
              {member.consentTerms ? '✓ Accepted' : '✗ Not accepted'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Privacy Policy</p>
            <p
              className={member.consentPrivacy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              style={{ fontSize: '0.875rem', fontWeight: 600 }}
            >
              {member.consentPrivacy ? '✓ Accepted' : '✗ Not accepted'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Location Services</p>
            <p
              className={member.consentLocation ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              style={{ fontSize: '0.875rem', fontWeight: 600 }}
            >
              {member.consentLocation ? '✓ Accepted' : '✗ Not accepted'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Notifications</p>
            <p
              className={member.consentNotifications ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
              style={{ fontSize: '0.875rem', fontWeight: 600 }}
            >
              {member.consentNotifications ? '✓ Accepted' : '✗ Not accepted'}
            </p>
          </div>
        </div>
      </section>

      {/* Last Update */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--secondary)', borderRadius: '0.75rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
        <p>Last updated: {formatOptionalDate(member.updatedAt, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  )
}
