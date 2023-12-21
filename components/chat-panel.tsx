import { type UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconRefresh, IconStop } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'

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
  > {
  id?: string
  title?: string
}

export function ChatPanel({
  id,
  title,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  messages
}: ChatPanelProps) {
  // Function to handle specific context button click
  const handleContextButtonClick = async (contextMessage: string) => {
    await append({
      id,
      content: contextMessage,
      role: 'user'
    })
  }
  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="flex h-10 items-center justify-center">
          {isLoading ? (
            <Button
              variant="outline"
              onClick={() => stop()}
              className="bg-background"
            >
              <IconStop className="mr-2" />
              Stop generating
            </Button>
          ) : (
            messages?.length >= 2 && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => reload()}>
                  <IconRefresh className="mr-2" />
                  Regenerate response
                </Button>
                {id ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleContextButtonClick(
                          "Explain Omega-3 fatty acids relation with Alzheimer's disease"
                        )
                      }
                    >
                      Omega-3
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleContextButtonClick(
                          "Explain Vitamin E relation with Alzheimer's disease"
                        )
                      }
                    >
                      Vitamin E
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleContextButtonClick(
                          "Explain Vitamin B12 relation with Alzheimer's disease"
                        )
                      }
                    >
                      Vitamin B12
                    </Button>
                  </>
                ) : null}
              </div>
            )
          )}
        </div>
        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            onSubmit={async value => {
              await append({
                id,
                content: value,
                role: 'user'
              })
            }}
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
