'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, X, Share } from 'lucide-react'
import {
  armInstallPromptCapture,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  registerPbServiceWorker,
  type PbBeforeInstallPromptEvent,
} from '@/components/pwa-provider'
import { isDashboardRoute } from '@/lib/dashboard-routes'

const INSTALLED_KEY = 'pb-pwa-installed'
/** Session-only hide — returns on the next visit */
const SESSION_HIDE_KEY = 'pb-pwa-prompt-session-hide'

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

function isAndroidChrome(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Android/i.test(ua) && /Chrome\//i.test(ua) && !/EdgA|OPR|SamsungBrowser/i.test(ua)
}

function readInstalled(): boolean {
  try {
    if (isStandaloneDisplay()) return true
    return localStorage.getItem(INSTALLED_KEY) === '1'
  } catch {
    return isStandaloneDisplay()
  }
}

/** Compact install chip — always clickable; falls back to browser instructions when needed. */
export function PwaInstallPrompt() {
  const pathname = usePathname()
  const [deferred, setDeferred] = useState<PbBeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [helpMode, setHelpMode] = useState<'none' | 'ios' | 'android' | 'desktop'>('none')
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
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    armInstallPromptCapture()

    if (isStandaloneDisplay()) {
      try {
        localStorage.setItem(INSTALLED_KEY, '1')
      } catch {
        /* ignore */
      }
      setOpen(false)
      return
    }

    const existing = getDeferredInstallPrompt()
    if (existing) setDeferred(existing)

    maybeShow()
    void registerPbServiceWorker()

    const onReady = (e: Event) => {
      const detail = (e as CustomEvent<PbBeforeInstallPromptEvent>).detail
      if (detail) setDeferred(detail)
      else {
        const again = getDeferredInstallPrompt()
        if (again) setDeferred(again)
      }
      window.setTimeout(() => maybeShow(), 400)
    }

    const onManualShow = () => {
      try {
        sessionStorage.removeItem(SESSION_HIDE_KEY)
      } catch {
        /* ignore */
      }
      const again = getDeferredInstallPrompt()
      if (again) setDeferred(again)
      setHelpMode('none')
      maybeShow()
    }

    const onReturn = () => {
      if (document.visibilityState === 'visible') maybeShow()
    }

    window.addEventListener('pb-install-prompt-ready', onReady)
    window.addEventListener('pb-show-install-prompt', onManualShow)
    document.addEventListener('visibilitychange', onReturn)
    window.addEventListener('pageshow', onReturn)

    const delayed = window.setTimeout(() => {
      const again = getDeferredInstallPrompt()
      if (again) setDeferred(again)
      maybeShow()
    }, 1500)

    return () => {
      window.clearTimeout(delayed)
      window.removeEventListener('pb-install-prompt-ready', onReady)
      window.removeEventListener('pb-show-install-prompt', onManualShow)
      document.removeEventListener('visibilitychange', onReturn)
      window.removeEventListener('pageshow', onReturn)
    }
  }, [maybeShow])

  const hideForSession = useCallback(() => {
    setOpen(false)
    setHelpMode('none')
    try {
      sessionStorage.setItem(SESSION_HIDE_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  const handleInstall = async () => {
    setBusy(true)
    setHelpMode('none')
    try {
      // Critical: call prompt() in the same user gesture. Do NOT await SW
      // registration first — that drops Chrome's transient activation and
      // the install dialog never appears.
      let promptEvent = deferred || getDeferredInstallPrompt()

      if (promptEvent) {
        await promptEvent.prompt()
        const choice = await promptEvent.userChoice
        if (choice.outcome === 'accepted') {
          try {
            localStorage.setItem(INSTALLED_KEY, '1')
          } catch {
            /* ignore */
          }
          clearDeferredInstallPrompt()
          setDeferred(null)
          setOpen(false)
          setHelpMode('none')
        }
        return
      }

      // No native prompt yet — ensure SW is registered, then retry briefly
      void registerPbServiceWorker()
      await new Promise((r) => window.setTimeout(r, 400))
      promptEvent = getDeferredInstallPrompt()
      if (promptEvent) {
        setDeferred(promptEvent)
        await promptEvent.prompt()
        const choice = await promptEvent.userChoice
        if (choice.outcome === 'accepted') {
          try {
            localStorage.setItem(INSTALLED_KEY, '1')
          } catch {
            /* ignore */
          }
          clearDeferredInstallPrompt()
          setDeferred(null)
          setOpen(false)
          setHelpMode('none')
        }
        return
      }

      if (isIosSafari()) setHelpMode('ios')
      else if (isAndroidChrome() || /Android/i.test(navigator.userAgent)) setHelpMode('android')
      else setHelpMode('desktop')
    } catch (error) {
      console.warn('[pwa] install prompt failed:', error)
      if (isIosSafari()) setHelpMode('ios')
      else if (/Android/i.test(navigator.userAgent)) setHelpMode('android')
      else setHelpMode('desktop')
    } finally {
      setBusy(false)
    }
  }

  if (isDashboardRoute(pathname)) return null
  if (!open || readInstalled()) return null

  return (
    <div
      className="fixed inset-x-3 bottom-4 z-[60] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-sm"
      role="status"
      aria-label="Install Passive Blessings"
    >
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 text-white shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 pl-2 pr-1.5 py-1.5">
          <img
            src="/api/pwa-icon?size=96"
            alt=""
            className="h-8 w-8 rounded-full bg-white object-contain p-0.5 shrink-0"
          />

          <button
            type="button"
            data-dashboard-control
            disabled={busy}
            onClick={() => void handleInstall()}
            className="min-w-0 flex-1 text-left !bg-transparent !shadow-none !min-h-0 !px-0 !rounded-none disabled:opacity-50"
          >
            <p className="text-xs font-semibold text-white leading-tight truncate">
              {busy ? 'Opening install…' : 'Install app'}
            </p>
            <p className="text-[10px] text-neutral-400 leading-tight truncate">
              Tap to add Passive Blessings
            </p>
          </button>

          <button
            type="button"
            data-dashboard-control
            disabled={busy}
            onClick={() => void handleInstall()}
            className="inline-flex items-center gap-1 !rounded-full !bg-white !text-neutral-950 text-xs font-semibold !px-3 !py-1.5 !min-h-0 !shadow-none shrink-0 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {busy ? '…' : 'Install'}
          </button>

          <button
            type="button"
            data-dashboard-control
            onClick={hideForSession}
            className="p-1.5 !rounded-full !bg-transparent !shadow-none !min-h-0 !px-1.5 text-neutral-400 hover:text-white hover:!bg-neutral-800 shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {helpMode === 'ios' ? (
          <div className="border-t border-neutral-800 px-3 py-2 text-[11px] text-neutral-300 space-y-1">
            <p className="font-semibold text-white inline-flex items-center gap-1">
              <Share className="h-3 w-3" /> iPhone / iPad
            </p>
            <p>Tap the Share button → <strong className="text-white">Add to Home Screen</strong> → Add.</p>
            <p className="text-neutral-500">Safari only — Chrome on iOS cannot install PWAs.</p>
          </div>
        ) : null}

        {helpMode === 'android' ? (
          <div className="border-t border-neutral-800 px-3 py-2 text-[11px] text-neutral-300 space-y-1">
            <p className="font-semibold text-white">Android</p>
            <p>
              Chrome menu (⋮) → <strong className="text-white">Install app</strong> or{' '}
              <strong className="text-white">Add to Home screen</strong>.
            </p>
            <p className="text-neutral-500">Use Chrome (not incognito). Reload once if Install is missing.</p>
          </div>
        ) : null}

        {helpMode === 'desktop' ? (
          <div className="border-t border-neutral-800 px-3 py-2 text-[11px] text-neutral-300 space-y-1">
            <p className="font-semibold text-white">Install from your browser</p>
            <p>
              Chrome / Edge: menu (⋮) → <strong className="text-white">Install Passive Blessings</strong>, or the
              install icon in the address bar.
            </p>
            <p>Use a normal (non-incognito) window. If Install is missing, the app may already be installed.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
