import { UseChatHelpers } from 'ai/react'
import {Button} from './ui/button.tsx'
import { IconArrowRight } from './ui/icons.tsx'
// import {Tooltip} from '"material-tailwind/react'

export interface props extends Pick<UseChatHelpers, 'setInput'>{}

const exampleMessages = [
    {
      heading: `Which supplement may slow the progression of Alzheimer's disease`,
      message: `Which supplement may slow the progression of Alzheimer's disease?`
    },
    {
      heading: 'Which factors can trigger Alzheimer’s to get worse?',
      message: 'Which factors can trigger Alzheimer’s to get worse?'
    }
  ]

export interface props extends Pick<UseChatHelpers, 'setInput' | 'append'>{id:string}

export function EmptyScreen({setInput, id, append}:props){

    return (
        <div className="mx-auto max-w-2xl px-4">
            <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
                <h1 className="text-lg font-semibold">
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
                        onClick={() => setInput(message.message)}
                        // onClick={async() => await append({
                        //     id,
                        //     content: message.message,
                        //     role:"user"
                        // })}
                    >
                    <IconArrowRight className="mr-2 text-muted-foreground" />
                    {message.heading}
                    </Button>
                ))}
                </div>

                <p className="leading-normal text-muted-foreground">
                You can also start a conversation about a specific supplement or its relation with the supported entity types.
                {/* <Tooltip content={nodeTypes} className="border border-blue-gray-50 bg-white px-4 py-3 shadow-xl shadow-black/10 text-gray-600 ">
                    <span className='underline'>{` `}supported entity types</span>
                </Tooltip>. */}
                </p>

            </div>
    </div>
    )
}