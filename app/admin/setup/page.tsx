'use client'

import React from 'react'
import { useState } from 'react'

export default function AdminSetupPage() {
  const [email, setEmail] = useState('admin@passiveblessings.com')
  const [accessCode, setAccessCode] = useState('ADMIN2025')
  const [adminSecret, setAdminSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/setup-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          accessCode,
          adminSecret,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to set access code')
        return
      }

      setMessage(`✓ Access code set successfully for ${email}`)
      setAdminSecret('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f6f2', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#111111' }}>Admin Setup</h1>
        
        <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#111111' }}>
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#111111' }}>
              Access Code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="e.g., ADMIN2025"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: '0.875rem', color: '#888888', marginTop: '0.5rem' }}>
              This is what admins will enter first on the login page
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#111111' }}>
              Admin Secret
            </label>
            <input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter admin secret from environment"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: '0.875rem', color: '#888888', marginTop: '0.5rem' }}>
              Set ADMIN_SETUP_SECRET in your environment variables
            </p>
          </div>

          {error && (
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#991b1b', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', color: '#166534', fontSize: '0.875rem' }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '0.875rem 1.5rem', backgroundColor: '#111111', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontSize: '1rem' }}
          >
            {loading ? 'Setting up...' : 'Set Access Code'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f7f6f2', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#666666' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Note:</p>
          <p>This page is for initial setup only. In production, restrict access to this page or remove it after setup.</p>
        </div>
      </div>
    </div>
  )
}
