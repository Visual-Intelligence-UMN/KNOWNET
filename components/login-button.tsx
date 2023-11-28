// login-button.tsx
'use client'
// Mark as a client component

import * as React from 'react'
import { signIn } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'

interface LoginButtonProps extends ButtonProps {
  provider: 'github' | 'google'
  text: string
  icon: JSX.Element
}

export function LoginButton({
  provider,
  text,
  icon,
  className,
  ...props
}: LoginButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => signIn(provider, { callbackUrl: '/' })}
      className={cn(className)}
      {...props}
    >
      {icon}
      {text}
    </Button>
  )
}
