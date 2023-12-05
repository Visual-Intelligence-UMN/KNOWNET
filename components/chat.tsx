'use client'

import { useChat, type Message } from 'ai/react'
import { GraphCard } from '@/components/ui/GraphCard'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'
import { usePathname, useRouter } from 'next/navigation'
import { GraphData } from '@/lib/types'

// const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )
  const [hasTokenBeenSet, setHasTokenBeenSet] = useLocalStorage<boolean>(
    'has-token-been-set',
    false
  )
  const initialRender = useRef(true)
  const [previewTokenDialog, setPreviewTokenDialog] = useState(false)
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')
  const [isGraphModalOpen, setGraphModalOpen] = useState(false)
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [
      { id: 1, label: 'Node 1', group: 'type1' },
      { id: 2, label: 'Node 2', group: 'type2' },
      { id: 3, label: 'Node 3', group: 'type3' }
    ],
    edges: [
      { source: 1, target: 2 },
      { source: 2, target: 3 }
    ]
  })
  const handleOpenGraphModal = () => {
    // Fetch and set the graph data if needed, then open the modal
    setGraphModalOpen(true)
  }

  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      initialMessages,
      id,
      body: {
        id,
        previewToken
      },
      onResponse(response) {
        if (response.status === 401) {
          toast.error(response.statusText)
        }
      },
      onFinish() {
        if (!path.includes('chat')) {
          router.push(`/chat/${id}`, { shallow: true })
          router.refresh()
        }
      }
    })

  useEffect(() => {
    if (initialRender.current) {
      const tokenSet = localStorage.getItem('has-token-been-set') === 'true'
      setPreviewTokenDialog(!tokenSet)
      initialRender.current = false
    }
  }, [])

  const handleSaveToken = () => {
    setPreviewToken(previewTokenInput)
    localStorage.setItem('has-token-been-set', 'true') // Directly update local storage
    setPreviewTokenDialog(false)
  }

  return (
    <>
      <div className={`container mx-auto ${className}`}>
        {/* <div className={cn('pb-[200px] pt-4 md:pt-10', className)}> */}

        <div className="flex flex-col md:flex-row pb-[200px] pt-4 md:pt-10 space-y-4 md:space-y-0 md:space-x-4">
          {messages.length ? (
            <>
              {' '}
              <div className="hidden md:block sticky top-4 h-[calc(100vh-1rem)]">
                <GraphCard graphData={graphData} />
              </div>
              <div className="grow overflow-auto">
                <ChatList messages={messages} />

                <ChatScrollAnchor trackVisibility={isLoading} />
              </div>
            </>
          ) : (
            <EmptyScreen setInput={setInput} />
          )}
        </div>
      </div>
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
      />

      <Dialog open={previewTokenDialog} onOpenChange={setPreviewTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter your OpenAI Key</DialogTitle>
            <DialogDescription>
              If you have not obtained your OpenAI API key, you can do so by{' '}
              <a
                href="https://platform.openai.com/signup/"
                className="underline"
              >
                signing up
              </a>{' '}
              on the OpenAI website. This is only necessary for preview
              environments so that the open source community can test the app.
              The token will be saved to your browser&apos;s local storage under
              the name <code className="font-mono">ai-token</code>.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={previewTokenInput}
            placeholder="OpenAI API key"
            onChange={e => setPreviewTokenInput(e.target.value)}
          />
          <DialogFooter className="items-center">
            <Button onClick={handleSaveToken}>Save Token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
