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
                backgroundColor: timeframe === tf ? 'var(--foreground)' : 'var(--card)',
                color: timeframe === tf ? 'var(--background)' : 'var(--foreground)',
                border: `1px solid ${timeframe === tf ? 'var(--foreground)' : 'var(--border)'}`,
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
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>No volunteer hours recorded yet</div>
      ) : (
        <div className="admin-table-scroll min-w-0">
          <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--foreground)' }}>Rank</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--foreground)' }}>Volunteer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--foreground)' }}>Hours</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--foreground)' }}>Department</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--foreground)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((volunteer, index) => (
                <tr
                  key={volunteer.volunteerId}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: index % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <span
                      className={index < 3 ? 'bg-amber-400 dark:bg-amber-500 text-black' : 'bg-muted text-foreground'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        fontWeight: 600,
                        fontSize: '14px',
                      }}
                    >
                      {volunteer.rank}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{volunteer.volunteerName || 'Unknown'}</td>
                  <td className="text-blue-600 dark:text-blue-400" style={{ padding: '12px', fontWeight: 600 }}>
                    {volunteer.hours || 0} hrs
                  </td>
                  <td style={{ padding: '12px' }}>{volunteer.department || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
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
