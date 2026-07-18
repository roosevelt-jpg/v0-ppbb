'use client'

import React from 'react'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { PartnersFeaturedProject } from '@/lib/partners-page-config'

function ProjectMedia({ project }: { project: PartnersFeaturedProject }) {
  const extras = (project.galleryURLs || []).filter(Boolean)
  const cover = project.imageURL || extras[0] || ''
  const collage = cover
    ? [cover, ...extras.filter((u) => u !== cover)].slice(0, 4)
    : extras.slice(0, 4)

  if (collage.length === 0) {
    return <div className="absolute inset-0 bg-neutral-200" />
  }

  if (collage.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={collage[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
    )
  }

  if (collage.length === 2) {
    return (
      <div className="absolute inset-0 grid grid-cols-2 gap-0.5 bg-white">
        {collage.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt="" className="h-full w-full object-cover" />
        ))}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 bg-white">
      {collage.slice(0, 4).map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url} src={url} alt="" className="h-full w-full object-cover" />
      ))}
    </div>
  )
}

function FeaturedProjectCard({ project }: { project: PartnersFeaturedProject }) {
  return (
    <article className="flex flex-col sm:flex-row overflow-hidden rounded-lg border border-[#e4e1da] bg-white min-w-0">
      <div className="relative w-full sm:w-[42%] min-h-[12rem] sm:min-h-[14rem] shrink-0 bg-neutral-100">
        <ProjectMedia project={project} />
        {project.date ? (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-black text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2.5 py-1.5">
            <Calendar className="h-3 w-3" aria-hidden />
            {project.date}
          </div>
        ) : null}
      </div>
      <div className="flex-1 p-4 sm:p-5 flex flex-col gap-2 min-w-0">
        <h3 className="font-headline text-lg sm:text-xl font-bold text-foreground break-words leading-snug">
          {project.title}
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
          {project.location ? (
            <span className="inline-flex items-center gap-1 min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="break-words">{project.location}</span>
            </span>
          ) : null}
          {project.partnerNames ? (
            <span className="inline-flex items-center gap-1 min-w-0">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="break-words">{project.partnerNames}</span>
            </span>
          ) : null}
        </div>
        {project.brief ? (
          <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-4 break-words">
            {project.brief}
          </p>
        ) : null}
        {project.ctaHref ? (
          <a
            href={project.ctaHref}
            className="mt-auto inline-flex w-fit items-center justify-center min-h-[40px] px-4 py-2 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-neutral-800 transition-colors"
          >
            {project.ctaLabel || 'Learn more'}
          </a>
        ) : null}
      </div>
    </article>
  )
}

/** Featured partnership projects — placed after “Build alongside us” on /partners. */
export function PartnersFeaturedProjects({
  projects,
}: {
  projects: PartnersFeaturedProject[]
}) {
  const list = (projects || []).filter((p) => p.title?.trim())
  if (list.length === 0) return null

  return (
    <section className="min-w-0 space-y-5 sm:space-y-6" aria-label="Featured partnership projects">
      <div>
        <p className="eyebrow text-muted-foreground mb-2">FEATURED PROJECTS</p>
        <h2 className="font-headline text-2xl sm:text-3xl font-bold text-foreground">
          Partnership projects
        </h2>
      </div>
      <div className="flex flex-col gap-4 sm:gap-5">
        {list.map((project) => (
          <FeaturedProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}
