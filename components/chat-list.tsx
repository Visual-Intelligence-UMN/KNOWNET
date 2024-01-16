'use client'
import React from 'react'
import { Message } from 'ai'
import { ChatMessage } from '@/components/chat-message'

import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel
} from '@material-tailwind/react'
import { useViewMode } from '@/components/ui/view-mode'

export interface ChatListProps {
  messages: Message[]
  activeStep: number
  setActiveStep: (step: number) => void
}

export function ChatList({
  messages,
  activeStep,
  setActiveStep
}: ChatListProps) {
  const { isPaneView } = useViewMode()

  const messagePairs: [Message, Message?][] = []
  for (let i = 0; i < messages.length; i += 2) {
    messagePairs.push([messages[i], messages[i + 1]])
  }

  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto px-14">
      {isPaneView ? (
        <>
          {messagePairs[activeStep]?.map(
            (message, index) =>
              message && <ChatMessage key={index} message={message} />
          )}
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
