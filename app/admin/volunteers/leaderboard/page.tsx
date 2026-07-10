'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { AdminPageLayout } from '@/components/admin-page-layout'

export default function VolunteerLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'month' | 'year' | 'all'>('month')

  useEffect(() => {
    let collectionName = 'volunteerHours'
    if (timeframe === 'month') {
      collectionName = 'volunteerHoursMonth'
    } else if (timeframe === 'year') {
      collectionName = 'volunteerHoursYear'
    }

    const q = query(collection(db, collectionName), orderBy('hours', 'desc'), limit(100))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc, index) => ({
        rank: index + 1,
        ...doc.data(),
      }))
      setLeaderboard(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [timeframe])

  return (
    <AdminPageLayout title="Volunteer Leaderboard" subtitle="Top volunteers by contribution">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['month', 'year', 'all'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '8px 16px',
                backgroundColor: timeframe === tf ? '#111111' : '#fff',
                color: timeframe === tf ? '#fff' : '#111111',
                border: `1px solid ${timeframe === tf ? '#111111' : '#ddd'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {tf === 'all' ? 'All Time' : tf === 'year' ? 'This Year' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No volunteer hours recorded yet</div>
      ) : (
        <div className="admin-table-scroll min-w-0">
          <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#111111' }}>Rank</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#111111' }}>Volunteer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#111111' }}>Hours</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#111111' }}>Department</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#111111' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((volunteer, index) => (
                <tr
                  key={volunteer.volunteerId}
                  style={{
                    borderBottom: '1px solid #eee',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: index < 3 ? '#FFD700' : '#e0e0e0',
                        color: '#111111',
                        fontWeight: 600,
                        fontSize: '14px',
                      }}
                    >
                      {volunteer.rank}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{volunteer.volunteerName || 'Unknown'}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#0066CC' }}>
                    {volunteer.hours || 0} hrs
                  </td>
                  <td style={{ padding: '12px' }}>{volunteer.department || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageLayout>
  )
}
