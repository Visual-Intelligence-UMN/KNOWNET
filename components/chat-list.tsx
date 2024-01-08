'use client'
import React from 'react'
import { Message } from 'ai'
import { ChatPane } from '@/components/chat-pane'
import { ChatMessage } from '@/components/chat-message'
import * as Switch from '@radix-ui/react-switch'
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel
} from '@material-tailwind/react'

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
  const [isPaneView, setIsPaneView] = React.useState(false)

  const toggleViewMode = () => {
    setIsPaneView(!isPaneView)
  }

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
      <div className="flex items-center mb-4">
        <Switch.Root
          className="w-[42px] h-[25px] bg-black rounded-full relative shadow-[0_2px_10px] shadow-blackA4 focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-black outline-none cursor-default right-2"
          id="switch-mode"
          checked={isPaneView}
          onCheckedChange={toggleViewMode}
        >
          <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-blackA4 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
        </Switch.Root>
        <label
          htmlFor="view-mode-switch"
          className="text-gray-700 dark:text-gray-200 text-sm leading-none pr-4"
        >
          {isPaneView ? 'Pane View' : 'Scroll View'}
        </label>
      </div>

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
