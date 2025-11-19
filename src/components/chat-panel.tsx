import { UseChatHelpers } from 'ai/react'
import { PromptForm } from './prompt-form'
import { FooterText } from './footer'
import { Button } from './ui/button'

export interface ChatPanelProps1
  extends Pick<
    UseChatHelpers,
    'append' | 'isLoading' | 'reload' | 'messages' | 'stop' | 'input' | 'setInput'
  > {
  id?: string
  // NEW: wire in recs + node label
  recommendations?: Array<{
    text: string
    head: { id: string; name: string; types: string[] }
    relation: { type: string; direction: string }
    tail: { id: string; name: string; types: string[] }
    count: number
    source: string
  }>
  clickedLabel?: string
}

export function ChatPanel({
  id,
  input,
  setInput,
  append,
  isLoading,
  recommendations = [],
  clickedLabel = ''
}: ChatPanelProps1) {
  const handlePromptSubmit = async (value: string) => {
    await append({ id, content: value, role: 'user' })
  }

  const handleRecClick = async (text: string) => {
    await append({ id, content: text, role: 'user' })
  }

  const hasRecs = recommendations.length > 0
  const header = hasRecs && clickedLabel
    ? `Tell me more about “${clickedLabel}”`
    : 'Tell me more about'

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50% z-50">
      <div className="mx-auto sm:max-w-[90vw] sm:px-4">
        <div className="mt-2 space-y-2 border-t bg-background px-4 py-3 shadow-lg sm:rounded-t-xl sm:border">
          {/* Recommendation pills row */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600 shrink-0">
              {header}
            </span>

            {/* horizontally scrollable pill rail */}
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex gap-2 w-max">
                {hasRecs ? (
                  recommendations.map((s) => (
                    <Button
                      key={`${s.head.name}-${s.relation.type}-${s.tail.name}`}
                      variant="secondary"
                      size="sm"
                      className="whitespace-nowrap"
                      title={`evidence: ${s.count}`}
                      onClick={() => handleRecClick(s.text)}
                    >
                      {s.text}
                      <span className="ml-2 text-xs opacity-70">({s.count})</span>
                    </Button>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Click a node in the graph to see suggestions
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Input */}
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
