'use client'
import React, { useState } from 'react'
import { Message } from 'ai'
import { ChatPane } from '@/components/chat-pane'
import { ChatMessage } from '@/components/chat-message'
import DotsMobileStepper from '@/components/dotstepper'
import * as Switch from '@radix-ui/react-switch'

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
  const [isPaneView, setIsPaneView] = useState(false) // State to manage switch position

  const toggleViewMode = () => {
    setIsPaneView(!isPaneView) // Toggle between true and false
  }

  const messagePairs: [Message, Message?][] = []
  for (let i = 0; i < messages.length; i += 2) {
    messagePairs.push([messages[i], messages[i + 1]])
  }

  const handleNext = () => {
    if (activeStep < messagePairs.length - 1) {
      setActiveStep(activeStep + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  if (!messages.length) {
    return null
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Switch.Root
          className="w-[42px] h-[25px]  bg-black rounded-full relative shadow-[0_2px_10px] shadow-blackA4 focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-black outline-none cursor-default right-2"
          id="airplane-mode"
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
          <ChatPane messagePair={messagePairs[activeStep] || []} />
          <DotsMobileStepper
            steps={messagePairs.length}
            activeStep={activeStep}
            handleNext={handleNext}
            handleBack={handleBack}
          />
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
