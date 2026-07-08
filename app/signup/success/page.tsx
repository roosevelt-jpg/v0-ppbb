'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { SiteLogo } from '@/components/site-logo'

export default function SignupSuccess() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ width: '100%', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111111', height: '28px', display: 'flex', alignItems: 'center' }}>
            <SiteLogo background="light" href="/" heightClass="h-7" />
          </div>
          <Link href="/login" style={{ fontSize: '0.75rem', fontWeight: 500, color: '#111111', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0.75rem' }}>
        <div style={{ maxWidth: '550px', width: '100%', textAlign: 'center' }}>
          {/* Success Icon */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle2 size={64} style={{ color: '#059669', strokeWidth: 1.5 }} />
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '1rem' }}>Account Created Successfully!</h1>

          {/* Message */}
          <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
            Your Passive Blessings account has been created. You can now log in with your email and password to access your member dashboard.
          </p>

          {/* Key Points */}
          <div style={{ backgroundColor: '#f7f6f2', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', textAlign: 'left' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111111', marginBottom: '0.75rem' }}>What&apos;s next:</p>
            <ul style={{ fontSize: '0.875rem', color: '#666', margin: 0, paddingLeft: '1.25rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Log in with your email and password</li>
              <li style={{ marginBottom: '0.5rem' }}>Complete your member profile</li>
              <li style={{ marginBottom: '0.5rem' }}>Explore volunteer and sponsorship opportunities</li>
              <li>Participate in community events and activities</li>
            </ul>
          </div>

          {/* CTA Button */}
          <Link href="/login" style={{ 
            display: 'inline-block',
            backgroundColor: '#111111',
            color: '#ffffff',
            padding: '0.875rem 1.5rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
            border: 'none'
          }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#222222'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111111'}>
            Go to Login
          </Link>

          {/* Additional Info */}
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '2rem' }}>
            Already have an account? <Link href="/login" style={{ color: '#111111', fontWeight: 600, textDecoration: 'none' }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
