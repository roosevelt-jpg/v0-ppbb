'use client'

import React, { useState } from 'react'
import { VolunteerSkill, VolunteerDepartment } from '@/lib/types'

const PREDEFINED_SKILLS: VolunteerSkill[] = [
  { id: '1', name: 'Teaching', category: 'professional', level: 'advanced' },
  { id: '2', name: 'Healthcare', category: 'professional', level: 'advanced' },
  { id: '3', name: 'Social Work', category: 'professional', level: 'advanced' },
  { id: '4', name: 'Programming', category: 'technical', level: 'intermediate' },
  { id: '5', name: 'Web Design', category: 'technical', level: 'intermediate' },
  { id: '6', name: 'Data Analysis', category: 'technical', level: 'advanced' },
  { id: '7', name: 'Public Speaking', category: 'soft', level: 'intermediate' },
  { id: '8', name: 'Leadership', category: 'soft', level: 'advanced' },
  { id: '9', name: 'Project Management', category: 'professional', level: 'advanced' },
  { id: '10', name: 'Marketing', category: 'professional', level: 'intermediate' },
  { id: '11', name: 'Arabic', category: 'languages', level: 'advanced' },
  { id: '12', name: 'English', category: 'languages', level: 'advanced' },
  { id: '13', name: 'French', category: 'languages', level: 'intermediate' },
]

const PREDEFINED_DEPARTMENTS: VolunteerDepartment[] = [
  { id: '1', name: 'Education', description: 'Teaching and educational support', color: '#0066CC' },
  { id: '2', name: 'Healthcare', description: 'Medical and health services', color: '#CC0000' },
  { id: '3', name: 'Community Support', description: 'Community assistance programs', color: '#009900' },
  { id: '4', name: 'Technology', description: 'Tech and IT support', color: '#FF6600' },
  { id: '5', name: 'Events', description: 'Event planning and coordination', color: '#6600CC' },
  { id: '6', name: 'Communications', description: 'Marketing and communications', color: '#003366' },
  { id: '7', name: 'Operations', description: 'Operations and administration', color: '#FFD700' },
]

export function VolunteerSkillsSelector({
  selectedSkills,
  onChange,
}: {
  selectedSkills: VolunteerSkill[]
  onChange: (skills: VolunteerSkill[]) => void
}) {
  const toggleSkill = (skill: VolunteerSkill) => {
    if (selectedSkills.find((s) => s.id === skill.id)) {
      onChange(selectedSkills.filter((s) => s.id !== skill.id))
    } else {
      onChange([...selectedSkills, skill])
    }
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '12px' }}>
        Select Skills
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
        {PREDEFINED_SKILLS.map((skill) => {
          const isSelected = selectedSkills.find((s) => s.id === skill.id)
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => toggleSkill(skill)}
              style={{
                padding: '10px 12px',
                border: isSelected ? '2px solid var(--foreground)' : '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--foreground)' : 'var(--card)',
                color: isSelected ? 'var(--background)' : 'var(--foreground)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {skill.name}
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {skill.category}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function VolunteerDepartmentSelector({
  selectedDepartment,
  onChange,
}: {
  selectedDepartment: VolunteerDepartment | undefined
  onChange: (dept: VolunteerDepartment) => void
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '12px' }}>
        Select Department
      </label>
      <select
        value={selectedDepartment?.id || ''}
        onChange={(e) => {
          const dept = PREDEFINED_DEPARTMENTS.find((d) => d.id === e.target.value)
          if (dept) onChange(dept)
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          fontSize: '14px',
          fontFamily: 'inherit',
          backgroundColor: 'var(--card)',
          color: 'var(--foreground)',
        }}
      >
        <option value="">-- Select Department --</option>
        {PREDEFINED_DEPARTMENTS.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name} - {dept.description}
          </option>
        ))}
      </select>
    </div>
  )
}
