'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { adminApiFetch } from '@/lib/admin-api-client'
import type { ChatbotDiagnostics } from '@/lib/chatbot-diagnostics'

export function ChatbotDiagnosticsPanel() {
  const [data, setData] = useState<ChatbotDiagnostics | null>(null)
  const [loading, setLoading] = useState(true)
  const [probing, setProbing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (probe = false) => {
    if (probe) setProbing(true)
    else setLoading(true)
    setError('')

    const json = await adminApiFetch<ChatbotDiagnostics>(
      `/api/admin/chatbot-diagnostics${probe ? '?probe=1' : ''}`
    )

    if (!json.success || !json.data) {
      setError(json.error || 'Failed to load diagnostics')
      setData(null)
    } else {
      setData(json.data)
    }

    setLoading(false)
    setProbing(false)
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  const online =
    data?.anthropic.configured &&
    data.anthropic.keyLooksValid &&
    (data.anthropic.probe == null || data.anthropic.probe.ok)

  return (
    <Card className="mb-6 border border-neutral-200 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
            ) : online ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
            <h2 className="text-sm font-semibold text-neutral-900">PB Assistant status</h2>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : data ? (
            <p className="mt-2 text-sm text-neutral-700 leading-relaxed">{data.recommendation}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load(false)}
            disabled={loading || probing}
            className="pb-outline-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={loading || probing || !data?.anthropic.configured}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            {probing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            Test Claude connection
          </button>
          <Link
            href="/admin/integrations"
            className="pb-outline-btn inline-flex items-center px-3 py-1.5 text-xs font-semibold"
          >
            Integrations
          </Link>
        </div>
      </div>

      {data ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Claude</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {data.anthropic.configured
                ? data.anthropic.probe?.ok === false
                  ? 'Configured · probe failed'
                  : data.anthropic.probe?.ok
                    ? 'Online'
                    : 'Key saved'
                : 'Not connected'}
            </p>
            <p className="text-xs text-neutral-500">
              Source: {data.anthropic.source}
              {data.anthropic.integrationStatus
                ? ` · ${data.anthropic.integrationStatus}`
                : ''}
            </p>
          </div>
          <div className="rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Model</p>
            <p className="mt-1 truncate text-sm font-semibold text-neutral-900">{data.anthropic.model}</p>
          </div>
          <div className="rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">FAQs</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {data.faqs.usable} usable
              <span className="font-normal text-neutral-500"> / {data.faqs.total}</span>
            </p>
          </div>
          <div className="rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Knowledge</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {data.knowledge.active} active
              <span className="font-normal text-neutral-500"> / {data.knowledge.total}</span>
            </p>
          </div>
        </div>
      ) : null}

      {data?.anthropic.probe?.error ? (
        <p className="mt-3 text-xs text-red-600">Probe error: {data.anthropic.probe.error}</p>
      ) : null}
      {data?.anthropic.probe?.ok ? (
        <p className="mt-3 text-xs text-green-700">
          Probe succeeded in {data.anthropic.probe.latencyMs}ms
        </p>
      ) : null}
    </Card>
  )
}
