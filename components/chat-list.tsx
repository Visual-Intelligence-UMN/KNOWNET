'use client'
import React from 'react'
import { Message } from 'ai'
import { ChatPane } from '@/components/chat-pane'
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

  // Create tab data based on the number of message pairs
  const tabsData = messagePairs.map((_, index) => ({
    label: `Step ${index + 1}`,
    value: index.toString() // Using index as value
  }))

  // Function to change the active step (tab)
  const handleTabClick = (step: number) => {
    console.log('Tab clicked, changing active step to:', step)
    setActiveStep(step)
  }

  if (!messages.length) {
    return null
  }

  return (
    <div className="p-4">
      {isPaneView ? (
        <>
          <Tabs key={activeStep} value={activeStep.toString()}>
            <TabsHeader
              className="rounded-none border-b border-blue-gray-50 bg-transparent p-0"
              indicatorProps={{
                className:
                  'bg-transparent border-b-2 border-gray-900 shadow-none rounded-none'
              }}
            >
              {tabsData.map(({ label, value }, index) => (
                <Tab
                  key={value}
                  value={value}
                  onClick={() => handleTabClick(index)}
                >
                  {label}
                </Tab>
              ))}
            </TabsHeader>
            <TabsBody>
              {/* Render only the active TabPanel */}
              <TabPanel value={activeStep.toString()}>
                <ChatPane messagePair={messagePairs[activeStep] || []} />
              </TabPanel>
            </TabsBody>
          </Tabs>
        </>
      ) : (
        <div className="relative mx-auto px-14">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatList
