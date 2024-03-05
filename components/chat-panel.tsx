import { type UseChatHelpers } from 'ai/react'
import React, { useRef, useEffect } from 'react'
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

import { useAtom } from 'jotai'
import {
  recommendationsAtom,
  keywordsListAnswerAtom,
  keywordsListQuestionAtom
} from '@/lib/state'

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
  continueConversation?: (
    recommendId: number,
    keywordsAnswer: string[],
    keywordsQuestion: string[]
  ) => void
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
  continueConversation
}: ChatPanelProps) {
  const [recommendations] = useAtom(recommendationsAtom)
  const [keywordsListAnswer] = useAtom(keywordsListAnswerAtom)
  const [keywordsListQuestion] = useAtom(keywordsListQuestionAtom)

  const topRecommendations = recommendations?.slice(0, 3) || []
  const otherRecommendations = recommendations?.slice(3) || []
  const keywordsAnswerRef = useRef(keywordsListAnswer)
  const keywordsQuestionRef = useRef(keywordsListQuestion)

  // Update refs whenever the keywords state changes
  useEffect(() => {
    keywordsAnswerRef.current = keywordsListAnswer
    keywordsQuestionRef.current = keywordsListQuestion
  }, [keywordsListAnswer, keywordsListQuestion])

  // Function to handle specific context button click
  const handleContextButtonClick = async (
    contextMessage: string,
    recommendId: number
  ) => {
    await append({
      id,
      content: contextMessage,
      role: 'user'
    })

    // Use the current value of the refs, which is always up-to-date
    const currentKeywordsAnswer = keywordsAnswerRef.current
    const currentKeywordsQuestion = keywordsQuestionRef.current

    console.log('Current Keywords Answer:', currentKeywordsAnswer)
    console.log('Current Keywords Question:', currentKeywordsQuestion)
    // Use the most updated keywordsAnswer and keywordsQuestion for continueConversation
    if (continueConversation) {
      continueConversation(
        recommendId,
        currentKeywordsAnswer,
        currentKeywordsQuestion
      )
    }
  }
  // Parse the recommendation string into actionable items
  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-4xl sm:px-4">
        <div className="flex flex-col gap-1">
          <div
            className={`grid grid-col-${
              otherRecommendations?.length > 0 ? '3' : '1'
            } gap-1 items-center justify-items-stretch`}
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
                    variant="default"
                    onClick={() => reload()}
                    className={`${
                      otherRecommendations?.length > 0
                        ? 'col-span-4'
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
                      handleContextButtonClick(rec.text, rec.id)
                    }}
                    className="m-2"
                    title={rec.text}
                  >
                    <p className="py-3 px-2 text-[5px] sm:text-sm align-middle truncate">
                      {rec.text}
                    </p>
                  </Button>
                ))}

                {/* Speed Dial Positioned in the third column if there are additional recommendations */}
                {otherRecommendations?.length > 0 && (
                  <div className="relative col-start-5 justify-self-center">
                    <SpeedDial>
                      <SpeedDialHandler>
                        <IconButton size="lg" className="rounded-full ">
                          <IconPlus className="h-5 w-5 transition-transform group-hover:rotate-45" />
                        </IconButton>
                      </SpeedDialHandler>
                      <SpeedDialContent>
                        {otherRecommendations.map(rec => (
                          <Button
                            key={rec.id}
                            variant="outline"
                            onClick={async () => {
                              handleContextButtonClick(rec.text, rec.id)
                            }}
                            className="m-1 py-3 px-2 text-[5px] sm:text-sm align-middle"
                            title={rec.text.substring(0, 100)}
                          >
                            <span className="py-3 px-2 text-[5px] sm:text-sm align-middle">
                              {rec.text.substring(0, 100)}...
                            </span>
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
