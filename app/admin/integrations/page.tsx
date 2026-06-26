'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAllServices, CATEGORIES } from '@/lib/integrations/services'
import { IntegrationCard } from '@/components/admin/integration-card'
import { Search, X } from 'lucide-react'

export default function IntegrationsPage() {
  const auth = useAuth()
  const [integrations, setIntegrations] = useState<any[]>([])
  const [health, setHealth] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [auth.firebaseUser])

  async function loadData() {
    if (!auth.firebaseUser) {
      console.log('[v0] No auth user yet, skipping load')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const token = await auth.firebaseUser.getIdToken()
      console.log('[v0] Got token, fetching integrations...')
      
      const [integrationsRes, healthRes] = await Promise.all([
        fetch('/api/admin/integrations', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(e => {
          console.error('[v0] Integrations fetch error:', e)
          return null
        }),
        fetch('/api/admin/integrations/health', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(e => {
          console.error('[v0] Health fetch error:', e)
          return null
        }),
      ])

      if (integrationsRes) {
        console.log('[v0] Integrations response:', integrationsRes.status, integrationsRes.ok)
        if (integrationsRes.ok) {
          const data = await integrationsRes.json()
          console.log('[v0] Integrations data:', data)
          setIntegrations(data.data || [])
        } else {
          console.error('[v0] Integrations request failed:', integrationsRes.status)
          const errText = await integrationsRes.text()
          console.error('[v0] Error response:', errText)
          setIntegrations([])
        }
      } else {
        setIntegrations([])
      }

      if (healthRes) {
        console.log('[v0] Health response:', healthRes.status, healthRes.ok)
        if (healthRes.ok) {
          const data = await healthRes.json()
          console.log('[v0] Health data:', data)
          setHealth(data.health || [])
        } else {
          console.error('[v0] Health request failed:', healthRes.status)
          const errText = await healthRes.text()
          console.error('[v0] Error response:', errText)
          setHealth([])
        }
      } else {
        setHealth([])
      }
    } catch (error) {
      console.error('[v0] Error loading data:', error)
      setIntegrations([])
      setHealth([])
    } finally {
      setLoading(false)
    }
  }

  const allServices = getAllServices()
  const filteredServices = allServices.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const configured = integrations.length
  const active = integrations.filter((i) => i.status === 'active').length
  const pending = allServices.length - configured

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>
          Integrations
        </h1>
        <p style={{ color: '#888888' }}>Manage API credentials, webhooks, and third-party services</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', padding: '1.5rem' }}>
          <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Integrations
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>{allServices.length}</p>
          <p style={{ color: '#888888', fontSize: '0.875rem', marginTop: '0.5rem' }}>Available & categories</p>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', padding: '1.5rem' }}>
          <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>{active}</p>
          <p style={{ color: '#888888', fontSize: '0.875rem', marginTop: '0.5rem' }}>Configured & live</p>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', padding: '1.5rem' }}>
          <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pending Setup
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>{pending}</p>
          <p style={{ color: '#888888', fontSize: '0.875rem', marginTop: '0.5rem' }}>Awaiting credentials</p>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', padding: '1.5rem' }}>
          <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Last Updated
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111' }}>Today</p>
          <p style={{ color: '#888888', fontSize: '0.875rem', marginTop: '0.5rem' }}>Jun 13, 2026 - 12:12 AM</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search className="absolute left-3 h-4 w-4 text-gray-400" style={{ pointerEvents: 'none' }} />
          <input
            type="search"
            name="integration-search"
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // Prevent the browser / password managers from autofilling an
            // email into this box. When that happened, the search filtered
            // out every service, unmounting the card whose modal was open and
            // making the configure modal appear to "close" by itself.
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
              paddingRight: searchTerm ? '2.5rem' : '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              border: '1px solid #e4e1da',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '0.5rem',
                padding: '0.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#888888',
              }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <a href="/admin/integrations/health" style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#111111',
          color: '#ffffff',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          textDecoration: 'none',
        }}>
          Health Status
        </a>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: selectedCategory === null ? '#111111' : '#ffffff',
            color: selectedCategory === null ? '#ffffff' : '#111111',
            border: `1px solid ${selectedCategory === null ? '#111111' : '#e4e1da'}`,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedCategory === category ? '#111111' : '#ffffff',
              color: selectedCategory === category ? '#ffffff' : '#111111',
              border: `1px solid ${selectedCategory === category ? '#111111' : '#e4e1da'}`,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888888' }}>Loading...</div>
      ) : filteredServices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888888' }}>
          {searchTerm ? 'No integrations match your search' : 'No integrations found'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {filteredServices.map((service) => {
            const integration = integrations.find((i) => i.serviceId === service.id)
            const serviceHealth = health.find((h) => h.serviceId === service.id)
            return (
              <IntegrationCard
                key={service.id}
                service={service}
                integration={integration}
                health={serviceHealth}
                onRefresh={() => {
                  setSearchTerm('')
                  setSelectedCategory(null)
                  loadData()
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
