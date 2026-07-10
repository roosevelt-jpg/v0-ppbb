'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Lock, Shield } from 'lucide-react'
import {
  clearIntegrationsUnlockToken,
  getIntegrationsUnlockToken,
  integrationsVaultHeaders,
  setIntegrationsUnlockToken,
} from '@/lib/integrations/vault-client'

type VaultStatus = {
  enabled: boolean
  unlocked: boolean
  isSuperAdmin: boolean
}

export function IntegrationsVaultGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const [status, setStatus] = useState<VaultStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [passcode, setPasscode] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [currentPasscode, setCurrentPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showManage, setShowManage] = useState(false)

  const refreshStatus = useCallback(async () => {
    if (!auth.firebaseUser) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = await auth.firebaseUser.getIdToken()
      const res = await fetch('/api/admin/integrations/vault', {
        headers: integrationsVaultHeaders(token),
      })
      if (!res.ok) {
        setError('Could not check vault status')
        setStatus(null)
        return
      }
      const data = await res.json()
      setStatus({
        enabled: Boolean(data.enabled),
        unlocked: Boolean(data.unlocked),
        isSuperAdmin: Boolean(data.isSuperAdmin),
      })
    } catch {
      setError('Could not check vault status')
    } finally {
      setLoading(false)
    }
  }, [auth.firebaseUser])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  async function unlock() {
    if (!auth.firebaseUser) return
    setBusy(true)
    setError('')
    try {
      const token = await auth.firebaseUser.getIdToken()
      const res = await fetch('/api/admin/integrations/vault', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'unlock', passcode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Unlock failed')
        return
      }
      if (data.unlockToken) setIntegrationsUnlockToken(data.unlockToken)
      setPasscode('')
      await refreshStatus()
    } catch {
      setError('Unlock failed')
    } finally {
      setBusy(false)
    }
  }

  async function setOrChangePasscode(isChange: boolean) {
    if (!auth.firebaseUser) return
    if (newPasscode.length < 6) {
      setError('Passcode must be at least 6 characters')
      return
    }
    if (newPasscode !== confirmPasscode) {
      setError('Passcodes do not match')
      return
    }
    setBusy(true)
    setError('')
    try {
      const token = await auth.firebaseUser.getIdToken()
      const res = await fetch('/api/admin/integrations/vault', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isChange ? 'change' : 'set',
          currentPasscode: isChange || status?.enabled ? currentPasscode : undefined,
          newPasscode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save passcode')
        return
      }
      if (data.unlockToken) setIntegrationsUnlockToken(data.unlockToken)
      setNewPasscode('')
      setConfirmPasscode('')
      setCurrentPasscode('')
      setShowManage(false)
      await refreshStatus()
    } catch {
      setError('Failed to save passcode')
    } finally {
      setBusy(false)
    }
  }

  async function clearPasscode() {
    if (!auth.firebaseUser) return
    setBusy(true)
    setError('')
    try {
      const token = await auth.firebaseUser.getIdToken()
      const res = await fetch('/api/admin/integrations/vault', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear', currentPasscode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to remove passcode')
        return
      }
      clearIntegrationsUnlockToken()
      setCurrentPasscode('')
      setShowManage(false)
      await refreshStatus()
    } catch {
      setError('Failed to remove passcode')
    } finally {
      setBusy(false)
    }
  }

  function lockNow() {
    clearIntegrationsUnlockToken()
    setStatus((s) => (s ? { ...s, unlocked: false } : s))
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
        Checking integrations vault…
      </div>
    )
  }

  const needsUnlock = Boolean(status?.enabled && !status.unlocked)

  if (needsUnlock) {
    return (
      <div
        style={{
          maxWidth: 420,
          margin: '4rem auto',
          padding: '2rem',
          border: '1px solid #e4e1da',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Lock size={22} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Integrations locked</h1>
        </div>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
          This page holds payment and API credentials. Enter the passcode set by a super admin to
          continue.
        </p>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && unlock()}
          placeholder="Passcode"
          autoFocus
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            marginBottom: 12,
          }}
        />
        {error && <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button
          type="button"
          onClick={unlock}
          disabled={busy || !passcode}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: busy || !passcode ? 0.6 : 1,
          }}
        >
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          padding: '12px 16px',
          background: status?.enabled ? '#f0fdf4' : '#fff7ed',
          border: `1px solid ${status?.enabled ? '#bbf7d0' : '#fed7aa'}`,
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <Shield size={16} />
          {status?.enabled ? (
            <span>Vault protected — credentials stay hidden until unlocked this session.</span>
          ) : (
            <span>
              Vault unprotected — {status?.isSuperAdmin
                ? 'set a passcode to lock this page.'
                : 'ask a super admin to set a passcode.'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {status?.enabled && getIntegrationsUnlockToken() && (
            <button
              type="button"
              onClick={lockNow}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: 6,
                background: '#fff',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Lock now
            </button>
          )}
          {status?.isSuperAdmin && (
            <button
              type="button"
              onClick={() => {
                setShowManage((v) => !v)
                setError('')
              }}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: 6,
                background: '#111',
                color: '#fff',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {status.enabled ? 'Manage passcode' : 'Set passcode'}
            </button>
          )}
        </div>
      </div>

      {showManage && status?.isSuperAdmin && (
        <div
          style={{
            marginBottom: 20,
            padding: 16,
            border: '1px solid #e4e1da',
            borderRadius: 8,
            background: '#fafafa',
            maxWidth: 480,
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>
            {status.enabled ? 'Change or remove passcode' : 'Protect Integrations with a passcode'}
          </h3>
          {status.enabled && (
            <input
              type="password"
              value={currentPasscode}
              onChange={(e) => setCurrentPasscode(e.target.value)}
              placeholder="Current passcode"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #ccc',
                borderRadius: 6,
                marginBottom: 8,
              }}
            />
          )}
          <input
            type="password"
            value={newPasscode}
            onChange={(e) => setNewPasscode(e.target.value)}
            placeholder="New passcode (min 6 characters)"
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #ccc',
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          <input
            type="password"
            value={confirmPasscode}
            onChange={(e) => setConfirmPasscode(e.target.value)}
            placeholder="Confirm new passcode"
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #ccc',
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          {error && <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOrChangePasscode(Boolean(status.enabled))}
              style={{
                padding: '8px 14px',
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {status.enabled ? 'Update passcode' : 'Enable protection'}
            </button>
            {status.enabled && (
              <button
                type="button"
                disabled={busy || !currentPasscode}
                onClick={clearPasscode}
                style={{
                  padding: '8px 14px',
                  background: '#fff',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Remove protection
              </button>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
