// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { IconOpenAI, IconUser } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'
import { useMemo } from 'react'

export interface ChatMessageProps {
  message: Message
  clickedNode?: any
}

export function ChatMessage({
  message,
  clickedNode,
  ...props
}: ChatMessageProps) {
  const labelColorMapping: { [key: string]: string } = {
    'Dietary Supplement': '#4e79a7', // Blue
    Disorders: '#f28e2c', // Orange
    Drug: '#e15759', // Red
    'Genes & Molecular Sequences': '#76b7b2', // Cyan
    Anatomy: '#59a14f', // Green
    'Living Beings': '#edc949', // Yellow
    Physiology: '#af7aa1', // Purple
    'Chemicals & Drugs': '#ff9da7', // Pink
    Procedures: '#9c755f', // Brown
    'Activities & Behaviors': '#bab0ab', // Gray
    'Concepts & Ideas': '#4e79a7', // Blue
    Device: '#f28e2c', // Orange
    Object: '#e15759', // Red
    Organization: '#76b7b2', // Cyan
    Phenomenon: '#59a14f' // Green
    // Add more label types and colors as needed
  }
  // Determine if the message is related to the hovered node
  const highlightMatchedWords = (text, clickedNode, labelColorMapping) => {
    if (!clickedNode) return text

    // Use clickedNode.data.label for matching in the text
    const regex = new RegExp(`\\b(${clickedNode.data.label})\\b`, 'gi')
    return text.replace(regex, matched => {
      // Use clickedNode.label to fetch the corresponding color
      const color = labelColorMapping[clickedNode.label] || '#000'
      return `<span style="color: ${color};">${matched}</span>`
    })
  }

  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'user'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'user' ? <IconUser /> : <IconOpenAI />}
      </div>
      <div
        className={cn(
          'flex-1 min-w-0 px-1 ml-4 space-y-2 overflow-hidden',
          message.role === 'assistant'
            ? 'overflow-y-auto max-h-96'
            : 'overflow-y-hidden'
        )}
      >
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              const highlightedText = highlightMatchedWords(
                children,
                clickedNode,
                labelColorMapping
              )

              return (
                <p
                  className="mb-2 last:mb-0"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              )
            }
            // code({ node, inline, className, children, ...props }) {
            //   if (children.length) {
            //     if (children[0] == '▍') {
            //       return (
            //         <span className="mt-1 cursor-default animate-pulse">▍</span>
            //       )
            //     }

            //     children[0] = (children[0] as string).replace('`▍`', '▍')
            //   }

            //   const match = /language-(\w+)/.exec(className || '')

            //   if (inline) {
            //     return (
            //       <code className={className} {...props}>
            //         {children}
            //       </code>
            //     )
            //   }

            //   return (
            //     <CodeBlock
            //       key={Math.random()}
            //       language={(match && match[1]) || ''}
            //       value={String(children).replace(/\n$/, '')}
            //       {...props}
            //     />
            //   )
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}
