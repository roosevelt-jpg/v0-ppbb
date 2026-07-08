'use client'

import Image from 'next/image'
import { CHATBOT_AVATAR_ALT, CHATBOT_AVATAR_SRC } from '@/lib/chatbot-avatar'

interface ChatbotAvatarProps {
  size?: number
  className?: string
  /** White-out avatar for dark backgrounds (e.g. page hero headers). */
  invertOnDark?: boolean
  priority?: boolean
}

export function ChatbotAvatar({
  size = 40,
  className = '',
  invertOnDark = false,
  priority = false,
}: ChatbotAvatarProps) {
  return (
    <Image
      src={CHATBOT_AVATAR_SRC}
      alt={CHATBOT_AVATAR_ALT}
      width={size}
      height={size}
      unoptimized
      priority={priority}
      className={`object-contain shrink-0 ${className}`}
      style={invertOnDark ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  )
}
