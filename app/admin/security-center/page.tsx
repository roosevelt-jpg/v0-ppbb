'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
import { subscribeToAllAuditLogs, type AuditLog } from '@/lib/admin-audit'
import { db } from '@/lib/firebase'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { AdminPageLayout } from '@/components/admin-page-layout'

type ChecklistKey =
  | 'accessControl'
  | 'auditLogging'
  | 'encryption'
  | 'securityReviews'
  | 'backupRecovery'

type ChecklistState = Record<ChecklistKey, boolean>

const DEFAULT_CHECKLIST: ChecklistState = {
  accessControl: true,
  auditLogging: true,
  encryption: true,
  securityReviews: false,
  backupRecovery: false,
}

const CHECKLIST_ITEMS: Array<{ key: ChecklistKey; label: string; hint: string }> = [
  {
    key: 'accessControl',
    label: 'Access Control Configured',
    hint: 'Admin roles and invite permissions are in use',
  },
  {
    key: 'auditLogging',
    label: 'Audit Logging Enabled',
    hint: 'Admin actions are written to audit logs',
  },
  {
    key: 'encryption',
    label: 'Encryption Enabled',
    hint: 'Integration secrets use encrypted vault storage',
  },
  {
    key: 'securityReviews',
    label: 'Regular Security Reviews',
    hint: 'Mark complete after your latest security review',
  },
  {
    key: 'backupRecovery',
    label: 'Backup and Recovery Plan',
    hint: 'Mark complete once backups and recovery steps are documented',
  },
]

export default function SecurityCenterPage() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [auditLogs, setAuditLogs] = useState<(AuditLog & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [securityScore, setSecurityScore] = useState(0)
  const [checklist, setChecklist] = useState<ChecklistState>(DEFAULT_CHECKLIST)
  const [savingKey, setSavingKey] = useState<ChecklistKey | null>(null)

  useEffect(() => {
    const unsub = subscribeToAllAuditLogs((logs) => {
      setAuditLogs(logs)
      const failedOps = logs.filter((l) => l.status === 'failed').length
      const failureRate = logs.length > 0 ? (failedOps / logs.length) * 100 : 0
      setSecurityScore(Math.max(0, Math.min(100, 100 - failureRate * 2)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadChecklist = async () => {
      try {
        const snap = await getDoc(doc(db, 'platformConfig', 'securityChecklist'))
        if (!cancelled && snap.exists()) {
          const data = snap.data() as Partial<ChecklistState>
          setChecklist({ ...DEFAULT_CHECKLIST, ...data })
        }
      } catch (error) {
        console.warn('[security-center] Could not load checklist:', error)
      }
    }
    void loadChecklist()
    return () => {
      cancelled = true
    }
  }, [])

  const last24h = Date.now() - 24 * 60 * 60 * 1000
  const recentEvents = auditLogs.filter((log) => log.timestamp > last24h)
  const failedEvents = recentEvents.filter((log) => log.status === 'failed')
  const uniqueAdmins = new Set(recentEvents.map((log) => log.adminId)).size

  const handleRecommendationAction = (action: string) => {
    if (action === 'Review Logs' || action === 'Improve') {
      router.push('/admin/audit-logs')
      return
    }
    if (action === 'View Admins') {
      router.push('/admin/management')
    }
  }

  const toggleChecklistItem = async (key: ChecklistKey) => {
    const next = { ...checklist, [key]: !checklist[key] }
    setChecklist(next)
    setSavingKey(key)
    try {
      await setDoc(
        doc(db, 'platformConfig', 'securityChecklist'),
        {
          ...next,
          updatedAt: new Date().toISOString(),
          updatedBy: firebaseUser?.uid || null,
        },
        { merge: true }
      )
    } catch (error) {
      console.error('[security-center] Failed to save checklist:', error)
      setChecklist(checklist)
      window.alert('Could not save checklist change. Check your permissions and try again.')
    } finally {
      setSavingKey(null)
    }
  }

  const recommendations = [
    failedEvents.length > 0 && {
      level: 'warning' as const,
      title: 'Multiple Failed Operations Detected',
      description: `${failedEvents.length} failed operations in the last 24 hours. Review audit logs for suspicious activity.`,
      action: 'Review Logs',
    },
    uniqueAdmins > 5 && {
      level: 'info' as const,
      title: 'Multiple Admin Users Active',
      description: `${uniqueAdmins} admin users have been active in the last 24 hours.`,
      action: 'View Admins',
    },
    securityScore < 80 && {
      level: 'warning' as const,
      title: 'Security Score Below Threshold',
      description: `Current security score is ${securityScore.toFixed(1)}%. Review recent activity.`,
      action: 'Improve',
    },
  ].filter(Boolean) as Array<{
    level: 'warning' | 'info'
    title: string
    description: string
    action: string
  }>

  const completedCount = Object.values(checklist).filter(Boolean).length

  return (
    <AdminPageLayout title="Security Center" subtitle="System security monitoring and recommendations">
      <div className="space-y-6 min-w-0">
        <div className="bg-white border border-[#e4e1da] rounded-lg p-6 sm:p-8 text-center">
          <ShieldCheck
            className="h-12 w-12 mx-auto mb-4"
            style={{ color: securityScore > 80 ? '#10b981' : '#f59e0b' }}
          />
          <p className="text-sm text-neutral-500 mb-1">Security Score</p>
          <p
            className="text-4xl sm:text-5xl font-bold font-headline"
            style={{
              color: securityScore > 80 ? '#10b981' : securityScore > 60 ? '#f59e0b' : '#ef4444',
            }}
          >
            {loading ? '…' : `${securityScore.toFixed(1)}%`}
          </p>
          <p className="text-sm text-neutral-600 mt-3">
            {securityScore > 80
              ? 'System is secure'
              : securityScore > 60
                ? 'Monitor closely'
                : 'Review immediately'}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Checklist progress: {completedCount}/{CHECKLIST_ITEMS.length}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 min-w-0">
            <p className="text-xs text-green-800 mb-1">Last 24 Hours</p>
            <p className="text-2xl font-bold text-green-700">{recentEvents.length}</p>
            <p className="text-sm text-green-800 mt-1">Events</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 min-w-0">
            <p className="text-xs text-red-800 mb-1">Last 24 Hours</p>
            <p className="text-2xl font-bold text-red-600">{failedEvents.length}</p>
            <p className="text-sm text-red-800 mt-1">Failed Operations</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-0">
            <p className="text-xs text-blue-900 mb-1">Active Admins</p>
            <p className="text-2xl font-bold text-blue-800">{uniqueAdmins}</p>
            <p className="text-sm text-blue-900 mt-1">In Last 24 Hours</p>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Security Recommendations</h2>
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.title}
                  className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-lg border ${
                    rec.level === 'warning'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <AlertTriangle
                    className="h-5 w-5 shrink-0 mt-0.5"
                    style={{ color: rec.level === 'warning' ? '#d97706' : '#10b981' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold mb-1 ${
                        rec.level === 'warning' ? 'text-amber-900' : 'text-green-800'
                      }`}
                    >
                      {rec.title}
                    </p>
                    <p className="text-sm text-neutral-600">{rec.description}</p>
                  </div>
                  <button
                    type="button"
                    data-dashboard-control
                    onClick={() => handleRecommendationAction(rec.action)}
                    className="shrink-0 min-h-[40px] px-4 rounded text-sm font-semibold text-white"
                    style={{
                      backgroundColor: rec.level === 'warning' ? '#f59e0b' : '#10b981',
                    }}
                  >
                    {rec.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#e4e1da] rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold text-neutral-900">Security Checklist</h2>
            <Link
              href="/admin/audit-logs"
              className="text-sm font-medium text-neutral-700 underline underline-offset-2"
            >
              Open Audit Logs →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {CHECKLIST_ITEMS.map((check) => {
              const completed = checklist[check.key]
              return (
                <label
                  key={check.key}
                  className="flex items-start gap-3 cursor-pointer rounded-lg p-2 hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={completed}
                    disabled={savingKey === check.key}
                    onChange={() => void toggleChecklistItem(check.key)}
                    className="mt-1 h-4 w-4 accent-black"
                  />
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-medium ${
                        completed ? 'text-green-700' : 'text-neutral-700'
                      }`}
                    >
                      {check.label}
                      {savingKey === check.key ? '…' : ''}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-0.5">{check.hint}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}
