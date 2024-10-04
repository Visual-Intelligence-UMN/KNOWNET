import * as React from 'react'
import { UseChatHelpers } from 'ai/react'
import { useEnterSubmit } from '../lib/hooks/use-enter-submit'
import Textarea from 'react-textarea-autosize'
import { Button } from './ui/button'
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
 } from './ui/tooltip.tsx'
 import { IconArrowElbow} from './ui/icons'
import { useActions, useAIState } from 'ai/rsc'



export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  onSubmit: (value: string) => Promise<void>
  isLoading: boolean
}

export function PromptForm({
    onSubmit,
    input,
    setInput,
    isLoading
  }: PromptProps) {
    const { formRef, onKeyDown } = useEnterSubmit()
    const inputRef = React.useRef<HTMLTextAreaElement>(null)
    // const {submitUserMessage} = useActions()
    // const {_, setMessages} = useUIState<typeof AI>()
  
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, [])
  
    return (
      <form
        onSubmit={async e => {
          e.preventDefault()
          const value = input.trim()
          setInput('')
          if (!value) return
          await onSubmit(value)
        }}
        ref={formRef}
      >
        <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
          <Textarea
            ref={inputRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Send a message."
            spellCheck={false}
            className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          />
          <div className="absolute right-0 top-4 sm:right-4">
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || input === ''}
                >
                  <IconArrowElbow />
                  <span className="sr-only">Send message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </form>
    )
  }
  