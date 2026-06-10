'use client'

import React from 'react'
import { getPageBySlug } from '@/lib/admin'
import { Page } from '@/lib/types'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { Menu, X, ArrowLeft } from 'lucide-react'

interface PageProps {
  params: {
    slug: string
  }
}

export default function DynamicPage({ params }: PageProps) {
  const [page, setPage] = React.useState<Page | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchPage = async () => {
      try {
        const fetchedPage = await getPageBySlug(params.slug)
        setPage(fetchedPage)
      } catch (error) {
        console.error('[v0] Error loading page:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" href="/" />
          
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
        {page.description && (
          <p className="text-xl text-muted-foreground mb-8">{page.description}</p>
        )}
        
        {page.imageUrl && (
          <img
            src={page.imageUrl}
            alt={page.title}
            className="w-full rounded-lg mb-8 object-cover max-h-96"
          />
        )}

        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size="sm" className="mb-4" />
              <p className="text-sm text-muted-foreground">Passive Blessings</p>
            </div>
            <div>
              <Link href="/" className="hover:text-primary text-sm">Home</Link>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Passive Blessings. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
