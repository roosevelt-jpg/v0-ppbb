'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ width: '100%', padding: '1rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111' }}>Passive Blessings</div>
          <Link href="/login" style={{ fontSize: '1rem', fontWeight: 500, color: '#111111', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', width: '100%' }}>
        {/* Left Form Column */}
        <div style={{ flex: 1, padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#111111' }}>Create your account</h2>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111111' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111111' }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>

              <button type="submit" style={{ padding: '1rem', backgroundColor: '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
                Create Account
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
                Already have an account? <Link href="/login" style={{ textDecoration: 'underline', fontWeight: 600, color: '#111111' }}>Sign in</Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ flex: 1, padding: '2rem 1rem', backgroundColor: '#111111', color: '#ffffff', display: 'none' }}>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Join Our Community</p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>
              Be part of Passive Blessings - a community dedicated to meaningful change and charitable impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
