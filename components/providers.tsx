'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ViewModeProvider } from '@/components/ui/view-mode'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ViewModeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ViewModeProvider>
    </NextThemesProvider>
  )
}
