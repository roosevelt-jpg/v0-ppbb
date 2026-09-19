'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Download, Bell, X, Smartphone } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { requestAndRegisterFCM } from '@/lib/fcm-client'
import { registerPbServiceWorker } from '@/components/pwa-provider'

const INSTALLED_KEY = 'pb-pwa-installed'
const ALERTS_KEY = 'pb-pwa-alerts-enabled'
/** Session-only hide — prompt returns on the next visit / tab focus */
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

function readAlertsEnabled(): boolean {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      localStorage.setItem(ALERTS_KEY, '1')
      return true
    }
    return localStorage.getItem(ALERTS_KEY) === '1'
  } catch {
    return false
  }
}

function onboardingComplete(): boolean {
  return readInstalled() && readAlertsEnabled()
}

export function PwaInstallPrompt() {
  const { user } = useAuth()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [notifDone, setNotifDone] = useState(false)

  const maybeShow = useCallback(() => {
    if (typeof window === 'undefined') return
    const doneInstall = readInstalled()
    const doneAlerts = readAlertsEnabled()
    setInstalled(doneInstall)
    setNotifDone(doneAlerts)

    if (doneInstall && doneAlerts) {
      setOpen(false)
      return
    }

    // Session hide only — returning to the site clears this and shows again
    try {
      if (sessionStorage.getItem(SESSION_HIDE_KEY) === '1') return
    } catch {
      /* ignore */
    }

    setOpen(true)
    if (isIosSafari() && !doneInstall) setIosHelp(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isStandaloneDisplay()) {
      try {
        localStorage.setItem(INSTALLED_KEY, '1')
      } catch {
        /* ignore */
      }
    }

    // Clear session hide when the user returns to the tab / navigates back
    try {
      sessionStorage.removeItem(SESSION_HIDE_KEY)
    } catch {
      /* ignore */
    }

    maybeShow()

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      window.setTimeout(() => maybeShow(), 1200)
    }

    const onManualShow = () => {
      try {
        sessionStorage.removeItem(SESSION_HIDE_KEY)
      } catch {
        /* ignore */
      }
      maybeShow()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        try {
          sessionStorage.removeItem(SESSION_HIDE_KEY)
        } catch {
          /* ignore */
        }
        maybeShow()
      }
    }

    const onPageShow = () => {
      try {
        sessionStorage.removeItem(SESSION_HIDE_KEY)
      } catch {
        /* ignore */
      }
      maybeShow()
    }

    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('pb-show-install-prompt', onManualShow)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', onPageShow)

    const delayed = window.setTimeout(() => maybeShow(), 2500)

    return () => {
      window.clearTimeout(delayed)
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('pb-show-install-prompt', onManualShow)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', onPageShow)
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
        setInstalled(true)
        setDeferred(null)
        // Keep prompt open until alerts are also enabled
        if (readAlertsEnabled()) {
          setOpen(false)
        }
      }
    } catch (error) {
      console.warn('[pwa] install prompt failed:', error)
    } finally {
      setBusy(false)
    }
  }

  const handleEnableAlerts = async () => {
    setBusy(true)
    try {
      await registerPbServiceWorker()
      let ok = false
      if (user?.id) {
        ok = await requestAndRegisterFCM(user.id)
      } else {
        const permission =
          'Notification' in window ? await Notification.requestPermission() : 'denied'
        ok = permission === 'granted'
      }
      setNotifDone(ok)
      if (ok) {
        localStorage.setItem(ALERTS_KEY, '1')
        if (readInstalled()) {
          setOpen(false)
        }
      }
    } catch (error) {
      console.warn('[pwa] notification enable failed:', error)
      setNotifDone(false)
    } finally {
      setBusy(false)
    }
  }

  // Mark installed when running as PWA after install
  useEffect(() => {
    if (!open) return
    if (isStandaloneDisplay()) {
      localStorage.setItem(INSTALLED_KEY, '1')
      setInstalled(true)
      if (readAlertsEnabled()) setOpen(false)
    }
  }, [open])

  if (!open || onboardingComplete()) return null

  return (
    <div
      className="fixed inset-x-3 bottom-[5.5rem] z-[60] sm:inset-x-auto sm:right-6 sm:bottom-24 sm:max-w-sm"
      role="dialog"
      aria-label="Install Passive Blessings"
    >
      <div className="rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
        <div
          className="flex items-start justify-between gap-2 px-4 pt-4 pb-2"
          style={{ backgroundColor: '#111111' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/api/pwa-icon?size=192"
              alt=""
              className="h-11 w-11 rounded-xl bg-white object-contain p-1 shrink-0"
            />
            <div className="min-w-0 text-white">
              <p className="font-semibold text-sm truncate">Install Passive Blessings</p>
              <p className="text-[11px] opacity-70 leading-snug">
                Install the app and enable alerts — we&apos;ll remind you until both are done.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={hideForSession}
            className="p-1 rounded hover:bg-white/10 text-white shrink-0"
            aria-label="Dismiss for now"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          {iosHelp && !installed ? (
            <p className="text-xs text-neutral-600 leading-relaxed">
              On iPhone/iPad: tap <strong>Share</strong> in Safari, then{' '}
              <strong>Add to Home Screen</strong>. Then enable alerts below.
            </p>
          ) : deferred && !installed ? (
            <p className="text-xs text-neutral-600 leading-relaxed">
              Add a home-screen icon, then turn on alerts for events and community updates.
            </p>
          ) : !installed ? (
            <p className="text-xs text-neutral-600 leading-relaxed">
              On Android Chrome: browser menu → <strong>Install app</strong>. On iPhone: Safari Share
              → <strong>Add to Home Screen</strong>. Then enable alerts below.
            </p>
          ) : (
            <p className="text-xs text-neutral-600 leading-relaxed">
              App installed. Enable phone alerts so you don&apos;t miss events and updates.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {!installed ? (
              !iosHelp && deferred ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleInstall()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-black text-white text-sm font-semibold px-3 py-2.5 disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  {busy ? 'Working…' : 'Install app'}
                </button>
              ) : (
                <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 text-neutral-800 text-sm font-semibold px-3 py-2.5">
                  <Smartphone className="h-4 w-4" />
                  {iosHelp
                    ? 'Use Share → Add to Home Screen'
                    : 'Use your browser Install / Add to Home Screen'}
                </div>
              )
            ) : (
              <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 text-green-900 text-sm font-semibold px-3 py-2.5">
                App installed
              </div>
            )}

            <button
              type="button"
              disabled={busy || notifDone}
              onClick={() => void handleEnableAlerts()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 text-neutral-900 text-sm font-semibold px-3 py-2.5 disabled:opacity-50"
            >
              <Bell className="h-4 w-4" />
              {notifDone ? 'Alerts enabled' : 'Enable phone alerts'}
            </button>
          </div>

          <button
            type="button"
            onClick={hideForSession}
            className="w-full text-center text-[11px] text-neutral-500 hover:text-neutral-800 py-1"
          >
            Not now — remind me when I return
          </button>
        </div>
      </div>
    </div>
  )
}
