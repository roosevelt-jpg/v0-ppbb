import type { MetadataRoute } from 'next'

const AI_BOT_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'Meta-ExternalAgent',
  'Amazonbot',
  'Applebot-Extended',
  'Diffbot',
  'PetalBot',
] as const

const PRIVATE_PATHS = ['/admin/', '/dashboard/', '/business/', '/sponsor/', '/api/']

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.passive-blessings.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      ...AI_BOT_AGENTS.map((userAgent) => ({
        userAgent,
        disallow: ['/'],
      })),
    ],
    host: baseUrl,
  }
}
