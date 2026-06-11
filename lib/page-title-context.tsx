'use client'

import React from 'react'

interface PageTitleContextType {
  title: string
  subtitle?: string
  setTitle: (title: string, subtitle?: string) => void
}

export const PageTitleContext = React.createContext<PageTitleContextType>({
  title: 'Platform Overview',
  subtitle: '',
  setTitle: () => {},
})

export function usePageTitle() {
  return React.useContext(PageTitleContext)
}
