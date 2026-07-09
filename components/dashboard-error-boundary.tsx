'use client'

import React from 'react'
import Link from 'next/link'

interface ErrorBoundaryProps {
  children: React.ReactNode
  homeHref?: string
  homeLabel?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[v0] Dashboard error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
          <div className="text-4xl" aria-hidden>
            ⚠️
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">This page couldn&apos;t load</h2>
          <p className="text-neutral-500 text-sm text-center max-w-sm">
            Something went wrong loading this section. Please try again or contact support if the
            problem continues.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="!bg-black !text-white px-6 py-2 rounded-lg text-sm"
            >
              Try Again
            </button>
            <Link
              href={this.props.homeHref || '/dashboard'}
              className="inline-flex items-center !bg-white !text-black border border-gray-300 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
            >
              {this.props.homeLabel || 'Go to Dashboard'}
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
