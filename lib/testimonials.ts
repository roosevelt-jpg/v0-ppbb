'use client'

import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export type TestimonialType = 'text' | 'video'

export interface Testimonial {
  id: string
  type: TestimonialType
  name: string
  role: string | null
  quote: string
  videoURL: string | null
  avatarURL: string | null
  isActive: boolean
  order: number
}

const MAX_TESTIMONIALS = 10

function mapTestimonialDoc(id: string, data: Record<string, unknown>): Testimonial {
  const legacyPublished = data.isPublished === true
  const isActive = data.isActive === true || (data.isActive === undefined && legacyPublished)

  return {
    id,
    type: data.type === 'video' ? 'video' : 'text',
    name: typeof data.name === 'string' ? data.name : '',
    role:
      typeof data.role === 'string'
        ? data.role
        : typeof data.title === 'string'
          ? data.title
          : null,
    quote:
      typeof data.quote === 'string'
        ? data.quote
        : typeof data.content === 'string'
          ? data.content
          : '',
    videoURL: typeof data.videoURL === 'string' ? data.videoURL : null,
    avatarURL:
      typeof data.avatarURL === 'string'
        ? data.avatarURL
        : typeof data.image === 'string'
          ? data.image
          : null,
    isActive,
    order: typeof data.order === 'number' ? data.order : 0,
  }
}

export function subscribeToActiveTestimonials(
  callback: (testimonials: Testimonial[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'testimonials'),
      (snapshot) => {
        const testimonials = snapshot.docs
          .map((d) => mapTestimonialDoc(d.id, d.data()))
          .filter((t) => t.isActive && (t.type === 'video' ? !!t.videoURL : !!t.quote))
          .sort((a, b) => a.order - b.order)
          .slice(0, MAX_TESTIMONIALS)
        callback(testimonials)
      },
      () => callback([])
    )
  } catch {
    callback([])
    return () => {}
  }
}

export function subscribeToAllTestimonials(callback: (testimonials: Testimonial[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'testimonials'),
      (snapshot) => {
        const testimonials = snapshot.docs
          .map((d) => mapTestimonialDoc(d.id, d.data()))
          .sort((a, b) => a.order - b.order)
        callback(testimonials)
      },
      () => callback([])
    )
  } catch {
    callback([])
    return () => {}
  }
}

export { MAX_TESTIMONIALS }
