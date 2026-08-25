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

function formatMemberLocation(location: User['location'] | undefined): string {
  if (!location) return NOT_PROVIDED
  const parts = [location.city, location.emirate, location.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : NOT_PROVIDED
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

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await setDoc(
        doc(db, 'users', userId),
        {
          ...formData,
          updatedAt: new Date(),
        },
        { merge: true }
      )

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
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>WhatsApp</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>{member.whatsappNumber || 'Not provided'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>Location</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>
                {formatMemberLocation(member.location)}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Professional Info */}
      {member.profession && (
        <section style={{ marginTop: '2rem', backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)', textTransform: 'uppercase' }}>Professional Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Job Title</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>{member.profession}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Employer</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>{member.employer || 'Not provided'}</p>
            </div>
            {member.skills && (member.skills ?? []).length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.75rem' }}>Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(member.skills ?? []).map(skill => (
                    <span key={skill} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--foreground)', color: 'var(--background)', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Volunteer Info */}
      {member.volunteerAvailability && (
        <section style={{ marginTop: '2rem', backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)', textTransform: 'uppercase' }}>Volunteer Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Available Days</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>
                {member.volunteerAvailability.days?.join(', ') || 'Not specified'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Hours Per Month</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>
                {member.volunteerAvailability.hoursPerMonth || 0} hours
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Preferred Department</p>
              <p style={{ fontSize: '1rem', color: 'var(--foreground)', fontWeight: 500 }}>
                {member.volunteerAvailability.preferredDepartment || 'Not specified'}
              </p>
            </div>
          </div>
        </section>
      )}

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
