'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Download, Bell, X, Smartphone } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { requestAndRegisterFCM } from '@/lib/fcm-client'
import { registerPbServiceWorker } from '@/components/pwa-provider'

const DISMISS_KEY = 'pb-pwa-prompt-dismissed-v1'
const INSTALLED_KEY = 'pb-pwa-installed'

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
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /WebKit/.test(ua)
  const chromeIos = /CriOS|FxiOS|EdgiOS/.test(ua)
  return iOS && webkit && !chromeIos
}

export function PwaInstallPrompt() {
  const { user } = useAuth()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notifDone, setNotifDone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isStandaloneDisplay()) {
      localStorage.setItem(INSTALLED_KEY, '1')
      return
    }
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      window.setTimeout(() => setOpen(true), 1800)
    }

    window.addEventListener('beforeinstallprompt', onBip)
    const onManualShow = () => {
      if (isStandaloneDisplay()) return
      setOpen(true)
      if (isIosSafari()) setIosHelp(true)
    }
    window.addEventListener('pb-show-install-prompt', onManualShow)

    // iOS never fires beforeinstallprompt — show Share instructions after a delay.
    if (isIosSafari()) {
      window.setTimeout(() => {
        if (localStorage.getItem(DISMISS_KEY) === '1') return
        if (isStandaloneDisplay()) return
        setIosHelp(true)
        setOpen(true)
      }, 4500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('pb-show-install-prompt', onManualShow)
    }
  }, [])

  const dismiss = useCallback(() => {
    setOpen(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
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
        setOpen(false)
      }
      setDeferred(null)
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
      if (user?.id) {
        const ok = await requestAndRegisterFCM(user.id)
        setNotifDone(ok)
      } else {
        const permission =
          'Notification' in window ? await Notification.requestPermission() : 'denied'
        setNotifDone(permission === 'granted')
      }
    } catch (error) {
      console.warn('[pwa] notification enable failed:', error)
      setNotifDone(false)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-x-3 bottom-[5.5rem] z-[60] sm:inset-x-auto sm:right-6 sm:bottom-24 sm:max-w-sm"
      role="dialog"
      aria-label="Install Passive Blessings"
    >
      <div className="rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2" style={{ backgroundColor: '#111111' }}>
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/api/pwa-icon?size=192"
              alt=""
              className="h-11 w-11 rounded-xl bg-white object-contain p-1 shrink-0"
            />
            <div className="min-w-0 text-white">
              <p className="font-semibold text-sm truncate">Install Passive Blessings</p>
              <p className="text-[11px] opacity-70 leading-snug">
                Pin us to your home screen — open like an app anytime.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="p-1 rounded hover:bg-white/10 text-white shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          {iosHelp ? (
            <p className="text-xs text-neutral-600 leading-relaxed">
              On iPhone/iPad: tap <strong>Share</strong> in Safari, then{' '}
              <strong>Add to Home Screen</strong>.
            </p>
          ) : deferred ? (
            <p className="text-xs text-neutral-600 leading-relaxed">
              Add a home-screen icon for faster access, then turn on alerts for new events and
              community updates.
            </p>
          ) : (
            <p className="text-xs text-neutral-600 leading-relaxed">
              On Android Chrome: browser menu → <strong>Install app</strong>. On iPhone: Safari Share →{' '}
              <strong>Add to Home Screen</strong>. Then enable alerts below for events and news.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {!iosHelp && deferred ? (
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
                {iosHelp ? 'Use Share → Add to Home Screen' : 'Use your browser Install / Add to Home Screen'}
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
            onClick={dismiss}
            className="w-full text-center text-[11px] text-neutral-500 hover:text-neutral-800 py-1"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
