import React from 'react'
import { CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SystemHealthPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>
          System Health
        </h1>
        <p style={{ color: '#888888' }}>System status monitoring</p>
      </div>

      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '0.5rem', 
        border: '1px solid #e4e1da',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <CheckCircle className="h-12 w-12 text-green-600" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111111', marginBottom: '0.5rem' }}>
          All Systems Operational
        </h2>
        <p style={{ color: '#888888' }}>Your Passive Blessings platform is running smoothly.</p>
      </div>
    </div>
  )
}
