import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'
import {tailwindColorMapping} from '@/components/chat-message'
import { Tooltip } from '@material-tailwind/react'

const nodeTypes = Object.keys(tailwindColorMapping).map(d=>(<div key={d}>{d}</div>))

const exampleMessages = [
  {
    heading: `Which supplement may slow the progression of Alzheimer's disease`,
    message: `Which supplement may slow the progression of Alzheimer's disease?`
  },
  {
    heading: 'Which factors can trigger Alzheimer’s to get worse?',
    message: 'Which factors can trigger Alzheimer’s to get worse?'
  },
  // {
  //   heading: 'What are 3 foods to slow Alzheimer’s?',
  //   message: `What are 3 foods to slow Alzheimer’s?`
  // }
]

export interface props extends Pick<UseChatHelpers, 'setInput'| 'append'>{id:string}

export function EmptyScreen({ setInput, append, id }: props)
   {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to KnowNet!
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          I am a chatbot who can help you construct a comprehensive understanding about objects of interest by providing both text and visual interactions!
          <br/>
          This demo specializes in dietary supplement and related health conditions.
        </p>

        <p className="leading-normal text-muted-foreground">
          You can try out the following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              // onClick={() => setInput(message.message)}
              onClick={async() => await append({
                  id,
                  content: message.message,
                  role: 'user'
                })
              }
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>

        <br/>
        <p className="leading-normal text-muted-foreground">
          You can also start a conversation about a specific supplement or its relation with 
          <Tooltip content={nodeTypes} className="border border-blue-gray-50 bg-white px-4 py-3 shadow-xl shadow-black/10 text-gray-600 ">
            <span className='underline'>{` `}supported entity types</span>
          </Tooltip>.
        </p>

      </div>
    </div>
  )
}
