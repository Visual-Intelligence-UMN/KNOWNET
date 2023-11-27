import React from 'react'

import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-muted-foreground',
        className
      )}
      {...props}
    >
      Visualization Conversational Agent AI chatbot built with{' '}
      <ExternalLink href="https://qianwen.info/">
        UMN Qianwen Wang's lab
      </ExternalLink>{' '}
      and{' '}
      <ExternalLink href="https://ruizhang.umn.edu/">
        Rui Zhang's lab
      </ExternalLink>
      .
    </p>
  )
}
