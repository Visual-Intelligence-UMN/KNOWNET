'use client'
import React, { use, useCallback, useEffect } from 'react'
import { Message } from 'ai'
import { ChatMessage } from '@/components/chat-message'
import { useViewMode } from '@/components/ui/view-mode'

export interface ChatListProps {
  messages: Message[]
  activeStep: number
  clickedNode: any
}

export function ChatList({ messages, activeStep, clickedNode }: ChatListProps) {
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
                clickedNode={clickedNode}
              />
            ))}
        </>
      ) : (
        <>
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
        </>
      )}
    </div>
  )
}

export default ChatList
