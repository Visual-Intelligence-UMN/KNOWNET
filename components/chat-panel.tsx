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
  recommendation?: string
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
  recommendation
}: ChatPanelProps) {
  // Function to handle specific context button click
  const handleContextButtonClick = async (contextMessage: string) => {
    await append({
      id,
      content: contextMessage,
      role: 'user'
    })
  }
  // Parse the recommendation string into actionable items
  // Parse the recommendation string into actionable items
  const recommendations =
    recommendation?.split('\n').filter(r => r.length) || []
  const topRecommendations = recommendations.slice(0, 3)
  const otherRecommendations = recommendations.slice(3)
  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-2 items-center justify-items-stretch">
            {isLoading ? (
              <Button
                variant="outline"
                onClick={() => stop()}
                className="col-span-2"
              >
                <IconStop className="mr-2" />
                Stop
              </Button>
            ) : (
              messages?.length >= 2 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => reload()}
                    className="col-span-2"
                  >
                    <IconRefresh className="mr-2" />
                    Regenerate response
                  </Button>
                  {/* Speed Dial Positioned Absolutely */}
                  <div className="relative col-start-3 row-start-2 row-span-2 ">
                    <SpeedDial>
                      <SpeedDialHandler>
                        <IconButton size="lg" className="rounded-full">
                          <IconPlus className="h-5 w-5 transition-transform group-hover:rotate-45 " />{' '}
                          {/* Adjust as needed */}
                        </IconButton>
                      </SpeedDialHandler>
                      <SpeedDialContent>
                        {otherRecommendations.map((rec, index) => (
                          // <SpeedDialAction key={index} className="relative">
                          //   <IconMessage /> {/* Adjust as needed */}
                          //   <Typography
                          //     // variant="small"
                          //     // color="blue-gray"
                          //     className="absolute top-2/4 -left-2/4 -translate-y-2/4 -translate-x-3/4 font-normal"
                          //     style={{ whiteSpace: 'nowrap' }}
                          //   >
                          //     {rec.substring(0, 100)}...
                          //   </Typography>
                          // </SpeedDialAction>
                          <Button
                            key={index}
                            variant="outline"
                            onClick={() => handleContextButtonClick(rec)}
                            className={`col-span-2 `}
                          >
                            {rec.substring(0, 100)}...
                          </Button>
                        ))}
                      </SpeedDialContent>
                    </SpeedDial>
                  </div>
                </>
              )
            )}
            {/* Top Recommendations */}
            {topRecommendations.map((rec, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleContextButtonClick(rec)}
                className={`col-span-2 `} // Make the first recommendation button larger if needed
              >
                {rec.substring(0, 100)}...
              </Button>
            ))}
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
