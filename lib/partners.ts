'use client'

import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

export type PartnerType =
  | 'sponsor'
  | 'partner'
  | 'charity'
  | 'government'
  | 'corporate'
  | 'grassroots'

export interface Partner {
  id: string
  name: string
  logoURL: string
  websiteURL: string | null
  type: PartnerType
  isActive: boolean
  order: number
}

export const DEFAULT_PARTNER_NAMES = [
  'Beit Al Khair',
  'PRO.PT',
  '1416 Fourteen Sixteen',
  'BCMK Law',
  'Barnies',
  'Blade Barbers',
  'COCO',
  'Collective365',
  'Condo City',
  'Creative Word',
  'Delargy',
  'Dream Fade',
  'DWS Marketing',
  'Eatro',
  'Emirfx',
  'KAYANA',
  'Legal Cover',
  'One Investment',
  'OTR Autos',
  'W.O.T',
  'XSEED',
  'SMK Holy Smokd',
  'TOP Challenger',
  'SBK Real Estate',
  'Pangea',
  'Public Cook',
  'Nishe',
  'L Dubai',
]

export function subscribeToActivePartners(callback: (partners: Partner[]) => void): () => void {
  try {
    const q = query(collection(db, 'partners'), where('isActive', '==', true))
    return onSnapshot(
      q,
      (snapshot) => {
        const partners = snapshot.docs
          .map((d) => {
            const data = d.data()
            return {
              id: d.id,
              name: data.name || '',
              logoURL: data.logoURL || '',
              websiteURL: data.websiteURL ?? null,
              type: (data.type || 'partner') as PartnerType,
              isActive: true,
              order: typeof data.order === 'number' ? data.order : 0,
            }
          })
          .sort((a, b) => a.order - b.order)
        callback(partners)
      },
      () => callback([])
    )
  } catch {
    callback([])
    return () => {}
  }
}

export function subscribeToAllPartners(callback: (partners: Partner[]) => void): () => void {
  try {
    return onSnapshot(collection(db, 'partners'), (snapshot) => {
      const partners = snapshot.docs
        .map((d) => {
          const data = d.data()
          return {
            id: d.id,
            name: data.name || '',
            logoURL: data.logoURL || '',
            websiteURL: data.websiteURL ?? null,
            type: (data.type || 'partner') as PartnerType,
            isActive: data.isActive !== false,
            order: typeof data.order === 'number' ? data.order : 0,
          }
        })
        .sort((a, b) => a.order - b.order)
      callback(partners)
    })
  } catch {
    callback([])
    return () => {}
  }
}
