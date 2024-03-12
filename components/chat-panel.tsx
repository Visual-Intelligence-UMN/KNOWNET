import { type UseChatHelpers } from 'ai/react'
import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconPlus, IconMessage } from '@/components/ui/icons'
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
  activeStep: number
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
  activeStep,
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
      content:
        'Can you tell me more about ' +
        contextMessage +
        ' related to my previous question?',
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

  const isRecomendationsHiding =
    isLoading || activeStep < messages.length / 2 - 1

  const TopRecommendations =
    !isRecomendationsHiding &&
    topRecommendations?.map(rec => (
      <Button
        key={rec.id}
        variant="outline"
        onClick={async () => {
          handleContextButtonClick(rec.text, rec.id)
        }}
        className="m-2"
        title={rec.text}
      >
        <p className="py-3 px-2 text-[5px] sm:text-sm">{rec.text}</p>
      </Button>
    ))

  const MoreRecommendations = !isRecomendationsHiding &&
    otherRecommendations?.length > 0 && (
      // <div className="relative col-start-5 justify-self-center">
      <SpeedDial>
        <SpeedDialHandler>
          <Button variant="outline" className="m-2">
            More ...
          </Button>
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
      // </div>
    )

  // Parse the recommendation string into actionable items
  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      {/* <ButtonScrollToBottom /> */}
      {/* {StopRegenerateButton} */}
      <div className="mx-auto sm:max-w-\[90vw\] sm:px-4">
        <div className="mt-2 space-y-1 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-2">
          <div className={`grid grid-cols-4 gap-1`}>
            {TopRecommendations}
            {/* Speed Dial Positioned in the third column if there are additional recommendations */}
            {MoreRecommendations}
          </div>

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
