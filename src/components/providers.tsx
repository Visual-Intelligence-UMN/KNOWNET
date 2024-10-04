'use client'

import { TooltipProvider } from './ui/tooltip'
import { ViewModeProvider } from './ui/view-mode'
import {ThemeProvider as NextThemesProvider} from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

export function Providers({children, ...props}: ThemeProviderProps) {
    return (
        <NextThemesProvider {...props}>
            <ViewModeProvider>
                <TooltipProvider> {children} </TooltipProvider>
            </ViewModeProvider>
        </NextThemesProvider>
    )
}