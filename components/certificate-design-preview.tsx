'use client'

import React from 'react'
import type { CertificateSignatory } from '@/lib/certificate-templates'
import { DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/logo-manager'

export type CertificatePreviewData = {
  title: string
  subtitle: string
  bodyText: string
  memberName: string
  hours: number
  credentialId?: string
  issuedDate?: string
  accentColor?: string
  logoURL?: string
  signatories?: CertificateSignatory[]
}

type CertificateDesignPreviewProps = {
  data: CertificatePreviewData
  className?: string
  id?: string
}

export function CertificateDesignPreview({ data, className = '', id }: CertificateDesignPreviewProps) {
  const accent = data.accentColor || '#111111'
  const logoSrc = data.logoURL?.trim() || DEFAULT_LOGO_ON_LIGHT_BG
  const signatories = data.signatories?.length
    ? data.signatories
    : [{ name: 'Founder', title: 'Founder', signatureURL: '' }]

  return (
    <div
      id={id}
      className={`relative bg-white border-4 rounded-sm shadow-lg overflow-hidden ${className}`}
      style={{ borderColor: accent }}
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0, ${accent} 1px, transparent 0, transparent 50%)`,
          backgroundSize: '12px 12px',
        }}
      />
      <div className="relative px-8 py-10 sm:px-12 sm:py-14 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Passive Blessings"
          className="h-16 sm:h-20 mx-auto mb-6 object-contain max-w-[220px]"
        />

        <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 mb-2">{data.subtitle}</p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mb-6">{data.title}</h2>

        <div className="w-24 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />

        <p className="text-sm sm:text-base text-neutral-700 leading-relaxed max-w-xl mx-auto mb-6">
          {data.bodyText}
        </p>

        <p className="font-serif text-2xl sm:text-3xl text-neutral-900 mb-2">{data.memberName}</p>
        <p className="text-sm text-neutral-500 mb-8">{data.hours} volunteer hours</p>

        <div
          className={`grid gap-6 mt-8 ${
            signatories.length === 1
              ? 'grid-cols-1 max-w-xs mx-auto'
              : signatories.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-lg mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {signatories.map((sig, idx) => (
            <div key={`${sig.name}-${idx}`} className="text-center">
              {sig.signatureURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sig.signatureURL}
                  alt={`${sig.name} signature`}
                  className="h-12 mx-auto mb-2 object-contain"
                />
              ) : (
                <div className="h-12 mb-2 flex items-end justify-center">
                  <span className="font-serif text-2xl text-neutral-400 italic">{sig.name.split(' ')[0]}</span>
                </div>
              )}
              <div className="border-t border-neutral-300 pt-2 mx-4">
                <p className="text-sm font-semibold text-neutral-900">{sig.name}</p>
                <p className="text-xs text-neutral-500">{sig.title}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 border-t border-neutral-100 pt-4">
          <span>{data.issuedDate || new Date().toLocaleDateString('en-GB')}</span>
          {data.credentialId ? <span className="font-mono">ID: {data.credentialId}</span> : null}
        </div>
      </div>
    </div>
  )
}
