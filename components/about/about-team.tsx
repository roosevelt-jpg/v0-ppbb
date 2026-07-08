'use client'

import React, { useEffect, useState } from 'react'
import { subscribeToAbout, DEFAULT_ABOUT, AboutConfig } from '@/lib/about-config'
import {
  subscribeToActiveTeamMembers,
  TeamMember,
  getTeamInitials,
} from '@/lib/team-members'

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <article className="bg-white rounded-lg border border-[#e4e1da] overflow-hidden min-w-0 flex flex-col">
      <div className="w-full aspect-[4/5] bg-[#f7f6f2] overflow-hidden">
        {member.photoURL ? (
          <img
            src={member.photoURL}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-200">
            <span className="font-headline text-3xl sm:text-4xl font-bold text-neutral-500">
              {getTeamInitials(member.name)}
            </span>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-headline text-lg sm:text-xl font-bold text-foreground break-words mb-1">
          {member.name}
        </h3>
        <p className="eyebrow text-[0.65rem] sm:text-xs text-muted-foreground break-words leading-snug">
          {member.title}
        </p>
      </div>
    </article>
  )
}

export function AboutTeam() {
  const [config, setConfig] = useState<AboutConfig>(DEFAULT_ABOUT)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [configReady, setConfigReady] = useState(false)
  const [membersReady, setMembersReady] = useState(false)

  useEffect(() => subscribeToAbout((data) => {
    setConfig(data)
    setConfigReady(true)
  }), [])

  useEffect(() => subscribeToActiveTeamMembers((data) => {
    setMembers(data)
    setMembersReady(true)
  }), [])

  if (!configReady || !membersReady) {
    return (
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-pulse overflow-x-hidden">
        <div className="max-w-[72rem] mx-auto">
          <div className="h-8 w-48 bg-neutral-200 rounded mx-auto mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] bg-neutral-200 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 bg-background overflow-x-hidden">
      <div className="max-w-[72rem] mx-auto w-full min-w-0">
        <p className="eyebrow text-muted-foreground text-center mb-2 break-words">
          {config.team.eyebrow}
        </p>
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 break-words">
          {config.team.headline}
        </h2>

        {members.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">No team members to display yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {members.map((member) => (
              <TeamCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
