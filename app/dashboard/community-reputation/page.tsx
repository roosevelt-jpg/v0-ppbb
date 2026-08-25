'use client'

import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
import { getCommunityReputation } from '@/lib/advanced-feature-queries'
import { CommunityReputation } from '@/lib/types'

export default function CommunityReputationPage() {
  const { user } = useAuth()
  const [userReputation, setUserReputation] = useState<CommunityReputation | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.id) {
          const reputation = await getCommunityReputation(user.id)
          setUserReputation(reputation)
        }

        // Fetch leaderboard
        const leaderboardSnap = await getDocs(
          query(collection(db, 'communityReputation'), orderBy('score', 'desc'), limit(50))
        )

        const leaderboardData = leaderboardSnap.docs.map((doc, index) => ({
          rank: index + 1,
          ...doc.data(),
        }))

        setLeaderboard(leaderboardData)

        // Find user rank
        if (user?.id) {
          const userInLeaderboard = leaderboardData.find((entry) => entry.userId === user.id)
          if (userInLeaderboard) {
            setUserRank(userInLeaderboard.rank)
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching reputation data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze':
        return '#CD7F32'
      case 'silver':
        return '#C0C0C0'
      case 'gold':
        return '#FFD700'
      case 'platinum':
        return '#E5E4E2'
      case 'diamond':
        return '#B9F2FF'
      default:
        return '#999'
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading reputation data...</div>

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '32px' }}>
        Community Reputation
      </h1>

      {/* User Reputation Card */}
      {userReputation && (
        <div
          style={{
            padding: '32px',
            backgroundColor: 'var(--card)',
            borderRadius: '12px',
            border: `3px solid ${getLevelColor(userReputation.level)}`,
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px', alignItems: 'center' }}>
            {/* Level Badge */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: getLevelColor(userReputation.level),
                  color: '#fff',
                  margin: '0 auto 16px',
                  fontSize: '48px',
                  fontWeight: 700,
                }}
              >
                {userReputation.level.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: 0, textTransform: 'capitalize' }}>
                {userReputation.level}
              </h3>
              {userRank > 0 && (
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '8px' }}>
                  Rank: #{userRank} / {leaderboard.length}
                </p>
              )}
            </div>

            {/* Score */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
                {userReputation.score.toLocaleString()}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Reputation Points</div>
            </div>

            {/* Contribution Breakdown */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '12px', margin: '0 0 12px 0' }}>
                Your Contributions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Volunteering</span>
                  <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    {userReputation.contributions.volunteering}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Donations</span>
                  <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    {userReputation.contributions.donations}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Referrals</span>
                  <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    {userReputation.contributions.referrals}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Community</span>
                  <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    {userReputation.contributions.community}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {userReputation.badges && userReputation.badges.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '12px', margin: 0 }}>
                Earned Badges
              </h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                {userReputation.badges.map((badge) => (
                  <div
                    key={badge.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'var(--secondary)',
                      borderRadius: '8px',
                    }}
                    title={badge.description}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{badge.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center' }}>{badge.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Community Leaderboard */}
      <div style={{ padding: '24px', backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '24px', margin: 0 }}>
          Top Community Members
        </h2>

        {leaderboard.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>No leaderboard data yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Rank</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Member</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Level</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Score</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Contributions</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.userId}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: entry.userId === user?.id ? 'var(--secondary)' : 'transparent',
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
                          backgroundColor: entry.rank <= 3 ? '#FFD700' : 'var(--muted)',
                          color: 'var(--foreground)',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 500 }}>
                      {entry.userId === user?.id ? `${user?.firstName || 'You'}` : `Member ${entry.rank}`}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: getLevelColor(entry.level),
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {entry.level}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: '#2563eb' }}>
                      {entry.score.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      V: {entry.contributions.volunteering} | D: {entry.contributions.donations} | R:{' '}
                      {entry.contributions.referrals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'var(--secondary)', borderRadius: '8px', borderLeft: '4px solid #0066CC' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '12px', margin: 0 }}>
          How Reputation Works
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Earn points through volunteering, donations, referrals, and community engagement</li>
          <li style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Level up: Bronze → Silver → Gold → Platinum → Diamond</li>
          <li style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Unlock special badges and recognition in the community</li>
          <li style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Access exclusive member benefits at higher levels</li>
        </ul>
      </div>
    </div>
  )
}
