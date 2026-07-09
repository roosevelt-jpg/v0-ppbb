'use client'

import React from 'react'
import Link from 'next/link'
import {
  DiscordIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  SnapchatIcon,
  TikTokIcon,
  XTwitterIcon,
  YouTubeIcon,
} from '@/components/social-brand-icons'

interface SocialLinks {
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  discord?: string
  tiktok?: string
  snapchat?: string
}

interface SocialMediaLinksProps {
  links: SocialLinks
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabels?: boolean
  variant?: 'default' | 'footer'
}

export function SocialMediaLinks({
  links,
  size = 'md',
  className = '',
  showLabels = false,
  variant = 'default',
}: SocialMediaLinksProps) {
  const sizeMap = {
    sm: { icon: 'w-4 h-4', padding: 'p-2' },
    md: { icon: 'w-5 h-5', padding: 'p-2.5' },
    lg: { icon: 'w-6 h-6', padding: 'p-3' },
  }

  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: FacebookIcon, url: links.facebook },
    { key: 'twitter', label: 'X (Twitter)', icon: XTwitterIcon, url: links.twitter },
    { key: 'instagram', label: 'Instagram', icon: InstagramIcon, url: links.instagram },
    { key: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon, url: links.linkedin },
    { key: 'youtube', label: 'YouTube', icon: YouTubeIcon, url: links.youtube },
    { key: 'discord', label: 'Discord', icon: DiscordIcon, url: links.discord },
    { key: 'tiktok', label: 'TikTok', icon: TikTokIcon, url: links.tiktok },
    { key: 'snapchat', label: 'Snapchat', icon: SnapchatIcon, url: links.snapchat },
  ]

  const activePlatforms = socialPlatforms.filter((p) => p.url)
  const isFooter = variant === 'footer'

  if (activePlatforms.length === 0) {
    return null
  }

  const brandColors: Record<string, string> = {
    facebook: '#1877F2',
    twitter: '#ffffff',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
    youtube: '#FF0000',
    discord: '#5865F2',
    tiktok: '#000000',
    snapchat: '#FFFC00',
  }

  return (
    <div className={`flex flex-wrap gap-3 items-center ${className}`}>
      {activePlatforms.map((platform) => {
        const IconComponent = platform.icon
        const brandColor = brandColors[platform.key] || '#111111'
        return (
          <Link
            key={platform.key}
            href={platform.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`${sizeMap[size].padding} rounded-full transition-all hover:scale-110 flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] ${
              isFooter ? 'text-white hover:bg-white/15 bg-white/10' : ''
            }`}
            style={
              isFooter
                ? undefined
                : {
                    backgroundColor: `${brandColor}18`,
                    color: brandColor,
                  }
            }
            onMouseEnter={
              isFooter
                ? undefined
                : (e) => {
                    e.currentTarget.style.backgroundColor = brandColor
                    e.currentTarget.style.color = '#ffffff'
                  }
            }
            onMouseLeave={
              isFooter
                ? undefined
                : (e) => {
                    e.currentTarget.style.backgroundColor = `${brandColor}18`
                    e.currentTarget.style.color = brandColor
                  }
            }
            title={platform.label}
            aria-label={platform.label}
          >
            <IconComponent className={sizeMap[size].icon} />
            {showLabels && <span className="text-xs font-medium">{platform.label}</span>}
          </Link>
        )
      })}
    </div>
  )
}
