import { getPolicy } from '@/lib/policy-manager'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params
  const policy = await getPolicy(slug)

  if (!policy) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Policy Not Found</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>The requested policy could not be found.</p>
        <Link href="/" style={{ color: '#111111', textDecoration: 'underline' }}>
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', paddingTop: '4rem' }}>
      {/* Header */}
      <div style={{ width: '100%', padding: '2rem 1rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/" style={{ color: '#111111', marginBottom: '1rem', display: 'inline-block', textDecoration: 'underline' }}>
            ← Back
          </Link>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111111' }}>
            {policy.title}
          </h1>
          <p style={{ color: '#888', fontSize: '0.875rem' }}>
            Last updated: {new Date(policy.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1rem', color: '#111111', lineHeight: '1.7' }}>
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {policy.content}
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ backgroundColor: '#f7f6f2', padding: '2rem 1rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Have questions about this policy?
          </p>
          <a href="mailto:legal@passiveblessings.com" style={{ color: '#111111', fontWeight: 600, textDecoration: 'underline' }}>
            Contact us
          </a>
        </div>
      </div>
    </div>
  )
}
