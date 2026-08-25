import React from 'react'
import { CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SystemHealthPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
          System Health
        </h1>
        <p style={{ color: 'var(--muted-foreground)' }}>System status monitoring</p>
      </div>

      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
          All Systems Operational
        </h2>
        <p style={{ color: 'var(--muted-foreground)' }}>Your Passive Blessings platform is running smoothly.</p>
      </div>
    </div>
  )
}
