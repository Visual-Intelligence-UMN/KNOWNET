'use client'
import { createContext, useState, useContext, ReactNode } from 'react'

interface ViewModeContextProps {
  isPaneView: boolean
  toggleViewMode: () => void
}

const ViewModeContext = createContext<ViewModeContextProps | undefined>(
  undefined
)

export function useViewMode() {
  const context = useContext(ViewModeContext)
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider')
  }
  return context
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [isPaneView, setIsPaneView] = useState(true)

  const toggleViewMode = () => {
    setIsPaneView(!isPaneView)
  }

  return (
    <ViewModeContext.Provider value={{ isPaneView, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  )
}
