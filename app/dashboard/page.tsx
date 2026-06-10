'use client'

import React from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { User } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Heart, Users, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = React.useState<User | null>(null)
  const [stats, setStats] = React.useState({
    registeredEvents: 0,
    donationAmount: 0,
    volunteeredHours: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) return

      try {
        // Fetch user data
        const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDocSnap.exists()) {
          setUser(userDocSnap.data() as User)
        }

        // Fetch registered events
        const eventsSnap = await getDocs(
          query(
            collection(db, 'events'),
            where('attendees', 'array-contains', firebaseUser.uid)
          )
        )

        // Fetch donations
        const donationsSnap = await getDocs(
          query(
            collection(db, 'donations'),
            where('donorId', '==', firebaseUser.uid),
            where('status', '==', 'completed')
          )
        )

        const totalDonated = donationsSnap.docs.reduce(
          (sum, doc) => sum + (doc.data().amount || 0),
          0
        )

        setStats({
          registeredEvents: eventsSnap.size,
          donationAmount: totalDonated,
          volunteeredHours: userDocSnap.data()?.volunteeredHours || 0,
        })
      } catch (error) {
        console.error('[v0] Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    {
      title: 'Volunteered Hours',
      value: stats.volunteeredHours,
      suffix: 'hours this year',
      icon: Clock,
      color: '#e3f2fd',
      iconColor: '#1976d2',
    },
    {
      title: 'Events Attended',
      value: stats.registeredEvents,
      suffix: 'events this year',
      icon: Calendar,
      color: '#e8f5e9',
      iconColor: '#388e3c',
    },
    {
      title: 'Total Donations',
      value: `AED ${stats.donationAmount.toLocaleString()}`,
      suffix: 'total contributed',
      icon: Heart,
      color: '#ffebee',
      iconColor: '#d32f2f',
    },
    {
      title: 'Membership',
      value: (user?.membershipTier || 'standard').toUpperCase(),
      suffix: `since ${new Date(user?.memberSince || '').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`,
      icon: Users,
      color: '#f3e5f5',
      iconColor: '#7b1fa2',
    },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} style={{
              backgroundColor: stat.color,
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(17, 17, 17, 0.08)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s ease',
              cursor: 'default',
              ':hover': {
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-2px)',
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{stat.title}</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>{loading ? '...' : stat.value}</p>
                  <p style={{ fontSize: '12px', color: '#888888' }}>{stat.suffix}</p>
                </div>
                <Icon size={24} style={{ color: stat.iconColor }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions & Membership */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #e4e1da',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111111' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Browse Events', href: '/dashboard/events' },
              { label: 'Find Opportunities', href: '/dashboard/community' },
              { label: 'Make Donation', href: '/dashboard/donations' },
              { label: 'Edit Profile', href: '/dashboard/profile' },
            ].map(({ label, href }) => (
              <Link key={label} href={href}>
                <button style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #e4e1da',
                  backgroundColor: '#f7f6f2',
                  color: '#111111',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e4e1da'
                  e.currentTarget.style.borderColor = '#888888'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7f6f2'
                  e.currentTarget.style.borderColor = '#e4e1da'
                }}>
                  {label}
                  <ArrowRight size={16} />
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* Membership Status */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #e4e1da',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.05) 0%, rgba(17, 17, 17, 0.02) 100%)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem', color: '#111111' }}>Membership Status</h3>
          <div style={{
            backgroundColor: '#111111',
            color: '#f7f6f2',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{user?.membershipTier?.toUpperCase() || 'STANDARD'}</p>
            <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '0.5rem' }}>Active Member</p>
          </div>
          <button style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '12px',
            backgroundColor: '#111111',
            color: '#f7f6f2',
            fontWeight: '600',
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#333333'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#111111'
          }}>
            View Benefits
          </button>
        </div>
      </div>

      {/* Community Impact */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid #e4e1da',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111111' }}>Community Impact</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          {[
            { value: '3,412', label: 'Active Members' },
            { value: '8,940', label: 'Volunteer Hours' },
            { value: 'AED 92K', label: 'Donations Tracked' },
          ].map(({ value, label }) => (
            <div key={label} style={{
              textAlign: 'center',
              padding: '1.5rem',
              backgroundColor: '#f7f6f2',
              borderRadius: '12px',
              border: '1px solid #e4e1da',
            }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>{value}</p>
              <p style={{ fontSize: '13px', color: '#888888', fontWeight: '500' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
