'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, X, Smartphone } from 'lucide-react'
import { registerPbServiceWorker } from '@/components/pwa-provider'
import { isDashboardRoute } from '@/lib/dashboard-routes'

const INSTALLED_KEY = 'pb-pwa-installed'
/** Session-only hide — returns on the next visit */
const SESSION_HIDE_KEY = 'pb-pwa-prompt-session-hide'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return mq || iosStandalone
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /WebKit/.test(ua)
  const chromeIos = /CriOS|FxiOS|EdgiOS/.test(ua)
  return iOS && webkit && !chromeIos
}

function readInstalled(): boolean {
  try {
    if (isStandaloneDisplay()) return true
    return localStorage.getItem(INSTALLED_KEY) === '1'
  } catch {
    return isStandaloneDisplay()
  }
}

/** Compact install-only chip — alerts are enabled from the member Dashboard. */
export function PwaInstallPrompt() {
  const pathname = usePathname()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)
  const [busy, setBusy] = useState(false)

  const maybeShow = useCallback(() => {
    if (typeof window === 'undefined') return
    if (readInstalled()) {
      setOpen(false)
      return
    }
    try {
      if (sessionStorage.getItem(SESSION_HIDE_KEY) === '1') return
    } catch {
      /* ignore */
    }
    setOpen(true)
    if (isIosSafari()) setIosHelp(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isStandaloneDisplay()) {
      try {
        localStorage.setItem(INSTALLED_KEY, '1')
      } catch {
        /* ignore */
      }
      setOpen(false)
      return
    }

    maybeShow()

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      window.setTimeout(() => maybeShow(), 1000)
    }

    const onManualShow = () => {
      try {
        sessionStorage.removeItem(SESSION_HIDE_KEY)
      } catch {
        /* ignore */
      }
      maybeShow()
    }

    const onReturn = () => {
      if (document.visibilityState === 'visible') maybeShow()
    }

    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('pb-show-install-prompt', onManualShow)
    document.addEventListener('visibilitychange', onReturn)
    window.addEventListener('pageshow', onReturn)

    const delayed = window.setTimeout(() => maybeShow(), 2800)

    return () => {
      window.clearTimeout(delayed)
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('pb-show-install-prompt', onManualShow)
      document.removeEventListener('visibilitychange', onReturn)
      window.removeEventListener('pageshow', onReturn)
    }
  }, [maybeShow])

  const hideForSession = useCallback(() => {
    setOpen(false)
    try {
      sessionStorage.setItem(SESSION_HIDE_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  const handleInstall = async () => {
    if (!deferred) {
      setIosHelp(true)
      return
    }
    setBusy(true)
    try {
      await registerPbServiceWorker()
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, '1')
        setDeferred(null)
        setOpen(false)
      }
    } catch (error) {
      console.warn('[pwa] install prompt failed:', error)
    } finally {
      setBusy(false)
    }
  }

  // Never block admin / dashboard / business workspaces
  if (isDashboardRoute(pathname)) return null
  if (!open || readInstalled()) return null

  return (
    <div
      className="fixed inset-x-3 bottom-4 z-[60] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-xs"
      role="status"
      aria-label="Install Passive Blessings"
    >
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white pl-2 pr-1.5 py-1.5 shadow-lg">
        <img
          src="/api/pwa-icon?size=96"
          alt=""
          className="h-8 w-8 rounded-full bg-neutral-100 object-contain p-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-neutral-900 leading-tight truncate">
            Install app
          </p>
          {iosHelp ? (
            <p className="text-[10px] text-neutral-500 leading-tight truncate">
              Share → Add to Home Screen
            </p>
          ) : null}
        </div>

        {deferred ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleInstall()}
            className="inline-flex items-center gap-1 rounded-full bg-black text-white text-xs font-semibold px-3 py-1.5 shrink-0 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {busy ? '…' : 'Install'}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 text-neutral-800 text-[10px] font-semibold px-2.5 py-1.5 shrink-0">
            <Smartphone className="h-3.5 w-3.5" />
            Menu
          </span>
        )}

        <button
          type="button"
          onClick={hideForSession}
          className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
