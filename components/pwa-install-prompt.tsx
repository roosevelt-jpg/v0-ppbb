'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Share } from 'lucide-react'
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

      // No native prompt yet. Register the worker; if it is not controlling
      // this page, reload once so Chrome can offer the real install dialog.
      void registerPbServiceWorker()
      if (!navigator.serviceWorker.controller) {
        try {
          if (sessionStorage.getItem('pb-install-reload') !== '1') {
            sessionStorage.setItem('pb-install-reload', '1')
            window.location.reload()
            return
          }
        } catch {
          /* ignore */
        }
      }

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

  if (isDashboardRoute(pathname) && !pathname?.startsWith('/admin')) return null
  if (!open || readInstalled()) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-max flex-col items-end gap-2" role="status">
      {helpMode === 'ios' ? (
        <div className="w-56 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] text-neutral-300 shadow-lg space-y-1">
          <p className="font-semibold text-white inline-flex items-center gap-1">
            <Share className="h-3 w-3" /> iPhone / iPad
          </p>
          <p>Share → <strong className="text-white">Add to Home Screen</strong> → Add.</p>
        </div>
      ) : null}
      {helpMode === 'android' ? (
        <div className="w-56 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] text-neutral-300 shadow-lg">
          <p>Chrome menu → <strong className="text-white">Install app</strong>.</p>
        </div>
      ) : null}
      {helpMode === 'desktop' ? (
        <div className="w-56 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] text-neutral-300 shadow-lg">
          <p>Browser menu → <strong className="text-white">Install Passive Blessings</strong>.</p>
        </div>
      ) : null}
      <button
        type="button"
        data-dashboard-control
        disabled={busy}
        onClick={() => void handleInstall()}
        aria-label="Install"
        className="inline-flex w-auto items-center gap-1 !rounded-full !bg-neutral-950 !text-white text-xs font-semibold !px-3 !py-1.5 !min-h-0 !shadow-lg shrink-0 disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        {busy ? '…' : 'Install'}
      </button>
    </div>
  )
}
