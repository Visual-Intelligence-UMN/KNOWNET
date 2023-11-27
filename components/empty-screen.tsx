import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Suggest supplements for Alzheimer’s disease',
    message: `Which supplement may slow the progression of Alzheimer's disease?`
  },
  {
    heading: 'What triggers Alzheimer’s to get worse?',
    message: 'What triggers Alzheimer’s to get worse?'
  },
  {
    heading: 'What are 3 foods to slow Alzheimer’s?',
    message: `What are 3 foods to slow Alzheimer’s?`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to Visualization Conversational Agent AI Chatbot!
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          I am a visualization conversational agent AI chatbot. I can help you
          answer health questions about supplement and diease.
        </p>
        <p className="leading-normal text-muted-foreground">
          You can start a conversation here or try the following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
