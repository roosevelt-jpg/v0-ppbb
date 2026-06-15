'use client'

import React from 'react'

export default function AdminDashboard() {
  return (
    <div style={{ minHeight: '100vh', padding: '40px', backgroundColor: '#f9fafb' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>Admin Dashboard</h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '40px' }}>Welcome to the Passive Blessings admin panel</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>FAQ Management</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Manage FAQs</p>
          <a href="/admin/faq" style={{ marginTop: '16px', display: 'inline-block', color: '#0066cc', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Go to FAQs →</a>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>Forms Management</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Manage Forms</p>
          <a href="/admin/forms" style={{ marginTop: '16px', display: 'inline-block', color: '#0066cc', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Go to Forms →</a>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>Pages Management</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Manage Pages</p>
          <a href="/admin/pages" style={{ marginTop: '16px', display: 'inline-block', color: '#0066cc', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Go to Pages →</a>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>Events Management</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Manage Events</p>
          <a href="/admin/events" style={{ marginTop: '16px', display: 'inline-block', color: '#0066cc', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Go to Events →</a>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>Donations</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Manage Donations</p>
          <a href="/admin/donations" style={{ marginTop: '16px', display: 'inline-block', color: '#0066cc', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Go to Donations →</a>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#666', marginBottom: '8px' }}>Settings</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Admin Settings</p>
          <a href="/admin/settings" style={{ marginTop: '16px', display: 'inline-block', color: '#0066cc', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Go to Settings →</a>
        </div>
      </div>
    </div>
  )
}
