'use client'
import React, { use, useCallback, useEffect } from 'react'
import { Message } from 'ai'
import { ChatMessage } from '@/components/chat-message'
import { useViewMode } from '@/components/ui/view-mode'
import { CustomGraphEdge, CustomGraphNode } from '@/lib/types'

export interface ChatListProps {
  messages: Message[]
  activeStep: number
  nodes: CustomGraphNode[]
  edges: CustomGraphEdge[]
  gptTriples: string[][]
  clickedNode: any
}

export function ChatList({
  messages,
  activeStep,
  nodes,
  edges,
  gptTriples,
  clickedNode,
}: ChatListProps) {
  const { isPaneView } = useViewMode()

  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto px-14">
      {isPaneView ? (
        <>
          {messages
            .slice(activeStep * 2, activeStep * 2 + 2)
            .map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                nodes={message.role=='user'?[]:nodes}
                edges={message.role=='user'?[]:edges}
                gptTriples={gptTriples}
                clickedNode={clickedNode}
              />
            ))}
        </>
      ) : (
        <>
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              gptTriples={gptTriples}
              nodes={message.role=='user'?[]:nodes}
              edges={message.role=='user'?[]:edges}
              clickedNode={clickedNode}
            />
          ))}
        </>
      )}
    </div>
  )
}

export default ChatList
