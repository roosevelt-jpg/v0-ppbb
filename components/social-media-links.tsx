'use client'

import Link from 'next/link'
import { Circle, Link2, ExternalLink, MessageCircle, Music, Share2, Zap, Heart } from 'lucide-react'

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
}

export function SocialMediaLinks({ links, size = 'md', className = '', showLabels = false }: SocialMediaLinksProps) {
  const sizeMap = {
    sm: { icon: 'w-4 h-4', padding: 'p-2' },
    md: { icon: 'w-5 h-5', padding: 'p-2.5' },
    lg: { icon: 'w-6 h-6', padding: 'p-3' },
  }

  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: Circle, color: '#1877F2', url: links.facebook },
    { key: 'twitter', label: 'Twitter', icon: Circle, color: '#1DA1F2', url: links.twitter },
    { key: 'instagram', label: 'Instagram', icon: Circle, color: '#E4405F', url: links.instagram },
    { key: 'linkedin', label: 'LinkedIn', icon: Circle, color: '#0A66C2', url: links.linkedin },
    { key: 'youtube', label: 'YouTube', icon: Circle, color: '#FF0000', url: links.youtube },
    { key: 'discord', label: 'Discord', icon: Circle, color: '#5865F2', url: links.discord },
    { key: 'tiktok', label: 'TikTok', icon: Circle, color: '#000000', url: links.tiktok },
    { key: 'snapchat', label: 'Snapchat', icon: Circle, color: '#FFFC00', url: links.snapchat },
  ]

  const activePlatforms = socialPlatforms.filter(p => p.url)

  if (activePlatforms.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-3 items-center ${className}`}>
      {activePlatforms.map(platform => {
        const IconComponent = platform.icon
        return (
          <Link
            key={platform.key}
            href={platform.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`${sizeMap[size].padding} rounded-full transition-all hover:scale-110 flex items-center justify-center gap-2`}
            style={{ 
              backgroundColor: `${platform.color}20`,
              color: platform.color,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = platform.color
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${platform.color}20`
              e.currentTarget.style.color = platform.color
            }}
            title={platform.label}
          >
            <IconComponent className={sizeMap[size].icon} />
            {showLabels && <span className="text-xs font-medium">{platform.label}</span>}
          </Link>
        )
      })}
    </div>
  )
}
