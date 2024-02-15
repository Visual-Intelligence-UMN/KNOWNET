import { type UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import {
  IconRefresh,
  IconStop,
  IconPlus,
  IconMessage
} from '@/components/ui/icons'
import { FooterText } from '@/components/footer'
import {
  SpeedDial,
  SpeedDialHandler,
  SpeedDialContent,
  SpeedDialAction,
  IconButton,
  Typography
} from '@material-tailwind/react'
import { Recommendation } from '@/lib/types'
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
  recommendations?: Recommendation[]
  continueConversation?: (recommendId: number) => void
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
  messages,
  recommendations,
  continueConversation
}: ChatPanelProps) {
  const topRecommendations = recommendations?.slice(0, 3) || []
  const otherRecommendations = recommendations?.slice(3) || []

  // Function to handle specific context button click
  const handleContextButtonClick = async (contextMessage: string) => {
    await append({
      id,
      content: contextMessage,
      role: 'user'
    })
  }
  // Parse the recommendation string into actionable items
  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="flex flex-col gap-1">
          <div
            className={`grid grid-cols-${
              otherRecommendations?.length > 0 ? '3' : '1'
            } gap-2 items-center justify-items-stretch`}
          >
            {/* Conditionally render the regenerate/stop button or speed dial based on isLoading and the presence of messages */}
            {isLoading ? (
              <Button
                variant="outline"
                onClick={() => stop()}
                className="col-span-1 justify-self-center"
              >
                <IconStop className="mr-2" />
                Stop
              </Button>
            ) : (
              <>
                {messages?.length >= 2 && (
                  <Button
                    variant="outline"
                    onClick={() => reload()}
                    className={`${
                      otherRecommendations?.length > 0
                        ? 'col-span-2'
                        : 'col-span-1 justify-self-center'
                    }`}
                  >
                    <IconRefresh className="mr-2" />
                    Regenerate response
                  </Button>
                )}

                {topRecommendations?.map(rec => (
                  <Button
                    key={rec.id}
                    variant="outline"
                    onClick={async () => {
                      handleContextButtonClick(rec.text)
                      if (continueConversation) {
                        continueConversation(rec.id)
                      }
                    }}
                    className="my-2"
                  >
                    {rec.text}
                  </Button>
                ))}

                {/* Speed Dial Positioned in the third column if there are additional recommendations */}
                {otherRecommendations?.length > 0 && (
                  <div className="relative col-start-3 justify-self-center">
                    <SpeedDial>
                      <SpeedDialHandler>
                        <IconButton size="lg" className="rounded-full">
                          <IconPlus className="h-5 w-5 transition-transform group-hover:rotate-45" />
                        </IconButton>
                      </SpeedDialHandler>
                      <SpeedDialContent>
                        {otherRecommendations.map(rec => (
                          <Button
                            key={rec.id}
                            variant="outline"
                            onClick={async () => {
                              handleContextButtonClick(rec.text)
                              if (continueConversation) {
                                continueConversation(rec.id)
                              }
                            }}
                            className="col-span-3"
                          >
                            {rec.text.substring(0, 100)}...
                          </Button>
                        ))}
                      </SpeedDialContent>
                    </SpeedDial>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
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
