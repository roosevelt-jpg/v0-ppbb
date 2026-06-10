'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { User } from '@/lib/types'
import { AlertCircle } from 'lucide-react'

interface MemberDetailViewerProps {
  memberId: string
}

export function MemberDetailViewer({ memberId }: MemberDetailViewerProps) {
  const [member, setMember] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const memberDoc = await getDoc(doc(db, 'users', memberId))
        if (memberDoc.exists()) {
          setMember({ id: memberDoc.id, ...memberDoc.data() as User })
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
  }, [memberId])

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading member details...</div>
  }

  if (error || !member) {
    return (
      <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', display: 'flex', gap: '1rem' }}>
        <AlertCircle style={{ color: '#dc2626', flexShrink: 0 }} />
        <p style={{ color: '#991b1b' }}>{error || 'Member not found'}</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e4e1da', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e4e1da', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111111', marginBottom: '0.5rem' }}>
          {member.firstName} {member.lastName}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>{member.email}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
          <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f0f0f0', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, color: '#111111', textTransform: 'capitalize' }}>
            {member.role || 'member'}
          </span>
          <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f0f0f0', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, color: '#111111' }}>
            Joined: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e4e1da' }}>
        <div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111111' }}>{member.volunteeredHours || 0}</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Volunteer Hours</p>
        </div>
        <div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111111' }}>AED {member.totalDonated || 0}</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Total Donated</p>
        </div>
        <div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111111', textTransform: 'capitalize' }}>{member.membershipTier || 'standard'}</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Membership Tier</p>
        </div>
        <div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111111' }}>{member.active ? 'Active' : 'Inactive'}</p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Status</p>
        </div>
      </div>

      {/* Personal Information */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111111' }}>Personal Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {member.dateOfBirth && (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Date of Birth</p>
              <p style={{ color: '#111111' }}>{new Date(member.dateOfBirth).toLocaleDateString()}</p>
            </div>
          )}
          {member.gender && (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Gender</p>
              <p style={{ color: '#111111', textTransform: 'capitalize' }}>{member.gender}</p>
            </div>
          )}
          {member.nationality && (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Nationality</p>
              <p style={{ color: '#111111' }}>{member.nationality}</p>
            </div>
          )}
          {member.emiratesId && (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Emirates ID</p>
              <p style={{ color: '#111111' }}>{member.emiratesId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111111' }}>Contact Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Email</p>
            <p style={{ color: '#111111', wordBreak: 'break-all' }}>{member.email}</p>
          </div>
          {member.phone && (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Phone</p>
              <p style={{ color: '#111111' }}>{member.phone}</p>
            </div>
          )}
          {member.whatsappNumber && (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>WhatsApp</p>
              <p style={{ color: '#111111' }}>{member.whatsappNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Professional Background */}
      {(member.profession || member.employer || member.skills?.length) && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111111' }}>Professional Background</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {member.profession && (
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Profession</p>
                <p style={{ color: '#111111' }}>{member.profession}</p>
              </div>
            )}
            {member.employer && (
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Employer</p>
                <p style={{ color: '#111111' }}>{member.employer}</p>
              </div>
            )}
          </div>
          {member.skills && member.skills.length > 0 && (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {member.skills.map(skill => (
                  <span key={skill} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f0f0f0', borderRadius: '9999px', fontSize: '0.875rem', color: '#111111' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location Information */}
      {member.location && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111111' }}>Location</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {member.location.address && (
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Address</p>
                <p style={{ color: '#111111' }}>{member.location.address}</p>
              </div>
            )}
            {member.location.city && (
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>City</p>
                <p style={{ color: '#111111' }}>{member.location.city}</p>
              </div>
            )}
            {member.location.country && (
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Country</p>
                <p style={{ color: '#111111' }}>{member.location.country}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Volunteer Information */}
      {member.volunteerAvailability && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111111' }}>Volunteer Availability</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {member.volunteerAvailability.days && member.volunteerAvailability.days.length > 0 && (
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>Available Days</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {member.volunteerAvailability.days.map(day => (
                    <span key={day} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f0f0f0', borderRadius: '9999px', fontSize: '0.875rem' }}>
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {member.volunteerAvailability.hoursPerMonth && (
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Hours Per Month</p>
                <p style={{ color: '#111111' }}>{member.volunteerAvailability.hoursPerMonth}</p>
              </div>
            )}
            {member.volunteerAvailability.preferredDepartment && (
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '0.25rem' }}>Preferred Department</p>
                <p style={{ color: '#111111' }}>{member.volunteerAvailability.preferredDepartment}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
