import { UseChatHelpers } from 'ai/react'
import { PromptForm } from './prompt-form'
import { FooterText } from './footer'

export interface ChatPanelProps0 {
    id?: string
    title?: string
    input: string
    setInput: (value: string) => void
    isAtBottom: boolean
    scrollToBottom: () => void
  }

export interface ChatPanelProps 
extends Pick<
UseChatHelpers,
| 'append'
| 'isLoading'
| 'reload'
| 'messages'
| 'stop'
| 'input'
| 'setInput'
>{
    id?: string
  title?: string
  activeStep: number
  scrollToBottom?: () => void
  continueConversation?: (recommendId: number, gptTriples: string[][]) => void
  firstConversation?: (gptTriples: string[][]) => void
}

export interface ChatPanelProps1
  extends Pick<
    UseChatHelpers,
    | 'append'
    | 'isLoading'
    | 'reload'
    | 'messages'
    | 'stop'
    | 'input'
    | 'setInput'
  > {
  id?: string
//   title?: string
//   activeStep: number
//   isAtBottom: boolean
//   scrollToBottom?: () => void
//   continueConversation?: (recommendId: number, gptTriples: string[][]) => void
//   firstConversation?: (gptTriples: string[][]) => void
}

export function ChatPanel({
    id,
    // title,
    input,
    setInput,
    append,
    isLoading,
    // scrollToBottom
}: ChatPanelProps1) {

    const handlePromptSubmit = async (value: string) => {
        await append({
            id,
            content: value,
            role: 'user'
        })
    }

    return (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
            <div className="mx-auto sm:max-w-\[90vw\] sm:px-4">
                <div className="mt-2 space-y-1 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-2 ">
                    <div className="flex  justify-center items-center">
                        {1 && (
                            <span className="text-gray-600 w-[180px]">
                            Tell me more about{' '}
                          </span>
                        )}
                        <div className={`grid grid-cols-4 gap-1`}>
                            {/* {TopRecommendations} */}
                            info
                                {/* Speed Dial Positioned in the third column if there are additional recommendations */}
                            {/* {MoreRecommendations} */}
                            </div>
                    </div>
                    <PromptForm
                        onSubmit={handlePromptSubmit}
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                    />
                    <FooterText className="hidden sm:block" />
                </div>
            </div>
        </div>
    )
}


