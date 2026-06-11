import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium'
  
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-neutral-200 text-neutral-800',
    outline: 'border border-neutral-300 bg-white text-neutral-700',
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}
