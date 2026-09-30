/**
 * Render an event description with the line breaks the author typed.
 * A single Enter starts a new paragraph so lines are not stuck together.
 */
export function EventDescriptionBody({
  text,
  className = 'space-y-4 text-gray-700 text-base sm:text-lg break-words leading-relaxed',
}: {
  text: string
  className?: string
}) {
  const paragraphs = String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) return null

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  )
}
