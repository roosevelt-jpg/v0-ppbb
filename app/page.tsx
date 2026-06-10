'use client'

import React from 'react'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/admin'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteSettings } from '@/lib/types'
import { Menu, X, ArrowRight, Users, Calendar, Heart } from 'lucide-react'

export default function HomePage() {
  const [siteSettings, setSiteSettings] = React.useState<SiteSettings | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSiteSettings()
        setSiteSettings(settings)
      } catch (error) {
        console.error('[v0] Error loading site settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const navigationItems = [
    { label: 'About us', href: '#' },
    { label: 'Events', href: '#' },
    { label: 'Volunteer', href: '#' },
    { label: 'Marketplace', href: '#' },
    { label: 'Contact', href: '#' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" href="/" />
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium hover:text-primary transition"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Join now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {sidebarOpen && (
          <div className="md:hidden border-t border-border p-4 space-y-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm hover:text-primary transition"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup" className="flex-1">
                <Button size="sm" className="w-full">
                  Join now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            Your community hub awaits
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-balance">
            {siteSettings?.siteDescription || 'Join a thriving community for events, volunteering, and mutual support'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">
                Join the community <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Learn more
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-secondary/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What you can do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Register & track events',
                description: 'Discover and join community events happening near you'
              },
              {
                icon: Users,
                title: 'Log volunteer hours',
                description: 'Record your contributions and earn certificates'
              },
              {
                icon: Heart,
                title: 'Make donations',
                description: 'Support campaigns and causes you believe in'
              },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="p-8 text-center">
                  <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold">3,412</p>
              <p className="text-muted-foreground mt-2">Active members</p>
            </div>
            <div>
              <p className="text-4xl font-bold">8,940</p>
              <p className="text-muted-foreground mt-2">Volunteer hours</p>
            </div>
            <div>
              <p className="text-4xl font-bold">AED 92K</p>
              <p className="text-muted-foreground mt-2">Donations tracked</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to make a difference?</h2>
          <p className="text-lg opacity-90 mb-8">
            Join {siteSettings?.siteName || 'Passive Blessings'} and become part of something meaningful
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Get started today <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size="sm" className="mb-4" />
              <p className="text-sm text-muted-foreground">{siteSettings?.siteName}</p>
            </div>
            <div>
              <p className="font-bold text-sm mb-4">Company</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-sm mb-4">Resources</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">FAQ</Link></li>
                <li><Link href="#" className="hover:text-foreground">Support</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-sm mb-4">Legal</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>{siteSettings?.footerText || '© 2025 Passive Blessings. All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
