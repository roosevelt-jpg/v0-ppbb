export const NEWSLETTER_TEMPLATE_OPTIONS = [
  { id: 'classic' as const, title: 'Classic Newsletter', description: 'Traditional single-column layout' },
  { id: 'modern' as const, title: 'Modern Newsletter', description: 'Bold typography with accent blocks' },
  { id: 'minimal' as const, title: 'Minimal Newsletter', description: 'Clean layout with generous whitespace' },
  { id: 'highlight' as const, title: 'Highlight Newsletter', description: 'Featured banner with prominent callout' },
]

export type NewsletterTemplateId = 'classic' | 'modern' | 'minimal' | 'highlight'
