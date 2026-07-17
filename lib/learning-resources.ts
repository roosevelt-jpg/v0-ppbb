'use client'

import { db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'

export type LearningResourceCategory = 'meditation' | 'reflection' | 'wisdom' | 'general'
export type LearningResourceType = 'video' | 'document' | 'article' | 'audio'
export type LearningResourceStatus = 'draft' | 'published'

export interface LearningResource {
  id: string
  title: string
  description: string
  category: LearningResourceCategory
  type: LearningResourceType
  author?: string
  url?: string
  fileUrl?: string
  duration?: string
  status: LearningResourceStatus
  createdAt?: Date
  updatedAt?: Date
}

export const SPIRITUAL_CATEGORY_OPTIONS = [
  { value: 'meditation' as const, label: 'Daily Meditations' },
  { value: 'reflection' as const, label: 'Community Reflections' },
  { value: 'wisdom' as const, label: 'Wisdom Articles' },
]

export const LEARNING_TYPE_OPTIONS: { value: LearningResourceType; label: string }[] = [
  { value: 'article', label: 'Article / reading' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Document / PDF' },
]

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? undefined : d
}

function normalize(id: string, data: Record<string, unknown>): LearningResource {
  const category = String(data.category || 'general').toLowerCase()
  const validCategory: LearningResourceCategory =
    category === 'meditation' || category === 'reflection' || category === 'wisdom'
      ? category
      : 'general'

  const type = String(data.type || 'article').toLowerCase()
  const validType: LearningResourceType =
    type === 'video' || type === 'document' || type === 'audio' ? type : 'article'

  return {
    id,
    title: String(data.title || ''),
    description: String(data.description || ''),
    category: validCategory,
    type: validType,
    author: data.author ? String(data.author) : undefined,
    url: data.url ? String(data.url) : undefined,
    fileUrl: data.fileUrl ? String(data.fileUrl) : undefined,
    duration: data.duration ? String(data.duration) : undefined,
    status: data.status === 'published' ? 'published' : 'draft',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export function subscribeToAllLearningResources(
  callback: (resources: LearningResource[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'learningResources'), (snap) => {
    const rows = snap.docs
      .map((d) => normalize(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
    callback(rows)
  })
}

export function subscribeToPublishedLearningResources(
  callback: (resources: LearningResource[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'learningResources'), where('status', '==', 'published'))
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => normalize(d.id, d.data() as Record<string, unknown>)))
    },
    (err) => onError?.(err as Error)
  )
}

export function spiritualCategoryLabel(category: LearningResourceCategory): string {
  return SPIRITUAL_CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? 'Learning'
}
