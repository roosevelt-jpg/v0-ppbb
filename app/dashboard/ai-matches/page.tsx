'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'

export default function VolunteerMatchingPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    minScore: 60,
    department: '',
  })

  useEffect(() => {
    if (!user?.id) return

    const q = query(collection(db, 'aiMatches'), where('volunteerId', '==', user.id))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matchData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((m: any) => m.matchScore >= filters.minScore)
          .sort((a: any, b: any) => b.matchScore - a.matchScore)

        setMatches(matchData)
        setLoading(false)
      },
      (err) => {
        console.error('[v0] aiMatches error:', err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.id, filters.minScore])

  const handleViewMatch = async (matchId: string) => {
    try {
      await updateDoc(doc(db, 'aiMatches', matchId), {
        viewed: true,
      })
    } catch (error) {
      console.error('[v0] Error marking match as viewed:', error)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading matches...</div>

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>AI-Powered Matches</h1>
      <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '32px' }}>
        We've found {matches.length} opportunities perfectly tailored to your skills and availability.
      </p>

      {/* Filters */}
      <div style={{ marginBottom: '32px', padding: '16px', backgroundColor: 'var(--secondary)', borderRadius: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginRight: '16px' }}>
          Minimum Match Score: {filters.minScore}%
          <input
            type="range"
            min="0"
            max="100"
            value={filters.minScore}
            onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
            style={{ marginLeft: '8px', verticalAlign: 'middle' }}
          />
        </label>
      </div>

      {matches.length === 0 ? (
        <div style={{ padding: '40px', backgroundColor: 'var(--secondary)', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted-foreground)' }}>No matches found at this score level. Lower the minimum score to see more opportunities.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {matches.map((match) => (
            <div
              key={match.id}
              style={{
                padding: '20px',
                backgroundColor: 'var(--card)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => handleViewMatch(match.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
                    Opportunity Match
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                    Perfect match for your profile
                  </p>
                </div>

                {/* Match Score Badge */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: match.matchScore >= 80 ? 'rgba(34,197,94,0.15)' : match.matchScore >= 60 ? 'rgba(249,115,22,0.15)' : 'rgba(168,85,247,0.15)',
                    color: match.matchScore >= 80 ? '#16a34a' : match.matchScore >= 60 ? '#ea580c' : '#9333ea',
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {match.matchScore}%
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center' }}>
                    Match
                  </div>
                </div>
              </div>

              {/* Match Reasons */}
              {match.reasons && match.reasons.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {match.reasons.map((reason: string, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(20,184,166,0.15)',
                        color: '#0d9488',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      ✓ {reason}
                    </span>
                  ))}
                </div>
              )}

              <button
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: '#111111',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
