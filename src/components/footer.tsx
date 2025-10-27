import React from 'react'
import { cn } from '../lib/utils'
import { ExternalLink } from './external-link'



export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
    return (
      <p
        className={cn(
          'px-2 text-center text-xs leading-normal text-muted-foreground',
          className
        )}
        {...props}
      >
        KNOWNET built by{' '}
        <ExternalLink href="https://qianwen.info/">
          UMN Qianwen Wang&apos;s lab
        </ExternalLink>{' '}
        and{' '}
        <ExternalLink href="https://ruizhang.umn.edu/">
          Rui Zhang&apos;s lab
        </ExternalLink>
        .
      </p>
    )
  }