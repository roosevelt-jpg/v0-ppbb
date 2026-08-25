'use client'

import React from 'react'
import { SponsorTag } from '@/lib/types'

const SPONSOR_TAGS: { value: SponsorTag; label: string; color: string; description: string }[] = [
  {
    value: 'gold_sponsor',
    label: 'Gold Sponsor',
    color: '#FFD700',
    description: 'Premium sponsorship level',
  },
  {
    value: 'community_partner',
    label: 'Community Partner',
    color: '#0066CC',
    description: 'Engaged community partner',
  },
  {
    value: 'charity_sponsor',
    label: 'Charity Sponsor',
    color: '#CC0000',
    description: 'Charitable organization',
  },
  {
    value: 'event_partner',
    label: 'Event Partner',
    color: '#009900',
    description: 'Event partnership supporter',
  },
  {
    value: 'vendor',
    label: 'Vendor',
    color: '#FF6600',
    description: 'Vendor/supplier',
  },
  {
    value: 'volunteer_sponsor',
    label: 'Volunteer Sponsor',
    color: '#6600CC',
    description: 'Sponsor supporting volunteers',
  },
  {
    value: 'strategic_partner',
    label: 'Strategic Partner',
    color: '#003366',
    description: 'Strategic partnership',
  },
]

export function SponsorTagsSelector({
  selectedTags,
  onChange,
}: {
  selectedTags: SponsorTag[]
  onChange: (tags: SponsorTag[]) => void
}) {
  const toggleTag = (tag: SponsorTag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '12px' }}>
        Sponsor Tags
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
        {SPONSOR_TAGS.map((tagOption) => (
          <button
            key={tagOption.value}
            type="button"
            onClick={() => toggleTag(tagOption.value)}
            style={{
              padding: '10px 12px',
              border: selectedTags.includes(tagOption.value) ? `2px solid ${tagOption.color}` : '1px solid var(--border)',
              backgroundColor: selectedTags.includes(tagOption.value) ? `${tagOption.color}20` : 'var(--card)',
              borderRadius: '6px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
            title={tagOption.description}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: tagOption.color }}>
              {tagOption.label}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
              {tagOption.description}
            </div>
          </button>
        ))}
      </div>
      {selectedTags.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {selectedTags.map((tag) => {
            const tagOption = SPONSOR_TAGS.find((t) => t.value === tag)
            return (
              <span
                key={tag}
                style={{
                  padding: '4px 8px',
                  backgroundColor: tagOption?.color,
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {tagOption?.label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
