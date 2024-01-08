'use client'
import {
  ReactFlow,
  Edge,
  Node,
  Position,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  OnConnect,
  Background,
  MiniMap,
  Controls
} from 'reactflow'
import 'reactflow/dist/style.css'
import React, { useCallback } from 'react'
import { useChat, type Message } from 'ai/react'
// import { GraphCard } from '@/components/ui/GraphCard'
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
// import { GraphData } from '@/lib/types'
// import Flow from '@/components/flow' // Import the Flow component
import DotsMobileStepper from '@/components/dotstepper'
import { v4 as uuidv4 } from 'uuid' // for generating unique IDs
import { cn } from '@/lib/utils'
// const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )

  const initialRender = useRef(true)
  const [previewTokenDialog, setPreviewTokenDialog] = useState(false)
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')

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
      onFinish: message => {
        // Add a new node and edge when a message is finished processing
        if (
          message.role === 'assistant' &&
          processedMessageIds.has(message.id) === false
        ) {
          const randomNodeIndex = Math.floor(Math.random() * nodeBank.length)
          const newNode = {
            ...nodeBank[randomNodeIndex],
            style: { backgroundColor: nodeBank[randomNodeIndex].data.color }
          }

          setNodes(prevNodes => {
            // Check if the node is already added
            if (prevNodes.find(node => node.id === newNode.id)) {
              return prevNodes
            }
            if (prevNodes.length > 0) {
              const randomExistingNodeIndex = Math.floor(
                Math.random() * prevNodes.length
              )
              const selectedNode = prevNodes[randomExistingNodeIndex]
              const newEdge = {
                id: `e${selectedNode.id}-${newNode.id}`,
                source: selectedNode.id,
                target: newNode.id,
                label: getRandomEdgeText(),
                animated: true
              }

              setEdges(prevEdges => [...prevEdges, newEdge])
            }
            return [...prevNodes, newNode]
          })

          setProcessedMessageIds(
            prevIds => new Set([...Array.from(prevIds), message.id])
          )
          setActiveStep(nodes.length - 1)
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

  // State management for nodes and edges using React Flow's hooks
  const initialNodes: Node<{ label: string }, string | undefined>[] = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 0' },
      position: { x: 250, y: 5 },
      className: 'light'
    },
    {
      id: '2',
      data: { label: 'Group A' },
      position: { x: 100, y: 100 },
      className: 'light',
      style: {
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        width: 200,
        height: 200
      }
    },
    {
      id: '2a',
      data: { label: 'Node A.1' },
      position: { x: 10, y: 50 },
      parentNode: '2'
    },
    {
      id: '3',
      data: { label: 'Node 1' },
      position: { x: 320, y: 100 },
      className: 'light'
    },
    {
      id: '4',
      data: { label: 'Group B' },
      position: { x: 320, y: 200 },
      className: 'light',
      style: {
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        width: 300,
        height: 300
      },
      type: 'group'
    },
    {
      id: '4a',
      data: { label: 'Node B.1' },
      position: { x: 15, y: 65 },
      className: 'light',
      parentNode: '4',
      extent: 'parent' as const
    },
    {
      id: '4b',
      data: { label: 'Group B.A' },
      position: { x: 15, y: 120 },
      className: 'light',
      style: {
        backgroundColor: 'rgba(255, 0, 255, 0.2)',
        height: 150,
        width: 270
      },
      parentNode: '4'
    },
    {
      id: '4b1',
      data: { label: 'Node B.A.1' },
      position: { x: 20, y: 40 },
      className: 'light',
      parentNode: '4b'
    },
    {
      id: '4b2',
      data: { label: 'Node B.A.2' },
      position: { x: 100, y: 100 },
      className: 'light',
      parentNode: '4b'
    }
  ]

  const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e2a-4a', source: '2a', target: '4a' },
    { id: 'e3-4b', source: '3', target: '4b' },
    { id: 'e4a-4b1', source: '4a', target: '4b1' },
    { id: 'e4a-4b2', source: '4a', target: '4b2' },
    { id: 'e4b1-4b2', source: '4b1', target: '4b2' }
  ]
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [activeStep, setActiveStep] = useState(0)
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set())
  const nodeBank = [
    {
      id: '11',
      data: {
        label: '#ffc800',
        color: '#ffc800'
      },
      position: { x: 0, y: 0 }
    },
    {
      id: '12',
      data: {
        label: '#6865A5',
        color: '#6865A5'
      },
      position: { x: 150, y: 0 }
    },
    {
      id: '13',
      data: {
        label: '#ff6700',
        color: '#ff6700'
      },
      position: { x: 50, y: 100 }
    },
    {
      id: '14',
      data: {
        label: '#0041d0',
        color: '#0041d0'
      },
      position: { x: 200, y: 100 }
    },
    {
      id: '15',
      data: {
        label: '#ff0072',
        color: '#ff0072'
      },
      position: { x: 0, y: 200 }
    },
    {
      id: '16',
      data: {
        label: '#00d7ca',
        color: '#00d7ca'
      },
      position: { x: 150, y: 200 }
    },
    {
      id: '17',
      data: {
        label: '#6ede87',
        color: '#6ede87'
      },
      position: { x: 50, y: 300 }
    },
    {
      id: '18',
      data: {
        label: '#9ca8b3',
        color: '#9ca8b3'
      },
      position: { x: 200, y: 300 }
    }
  ]
  useEffect(() => {
    setNodes(nds => nds.map((node, i) => ({ ...node, hidden: i > activeStep })))
    setEdges(eds =>
      eds.map(edge => ({
        ...edge
      }))
    )
  }, [activeStep, setNodes, setEdges])

  // Handler for dot stepper change
  const handleStepChange = (step: number) => {
    setActiveStep(step)
  }
  const proOptions = { hideAttribution: true }
  const onConnect: OnConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )
  // Function to generate random edge text
  const getRandomEdgeText = () => {
    const texts = ['Connected', 'Linked', 'Related', 'Joined', 'Associated']
    return texts[Math.floor(Math.random() * texts.length)]
  }
  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <div className="md:flex pt-4 md:pt-10">
            {/* Left column for GraphCard and Flow */}
            <div className="md:w-1/3 top-10 space-y-1 pr-4">
              {' '}
              {/* Adjust the padding-right (pr-4) as needed */}
              {/* <div className="top-4 h-[calc(40vh-1rem)]">
                <GraphCard graphData={graphData} />
              </div> */}
              <ReactFlowProvider>
                <div
                  className="sticky top-4 left-4 pb-10 border rounded-md shadow-md bg-white dark:bg-gray-800"
                  style={{
                    width: 'calc(100% - 2rem)',
                    height: 'calc(40vh - 1rem)'
                  }}
                >
                  <ReactFlow
                    nodes={nodes.filter((node, i) => i <= activeStep)}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    proOptions={proOptions}
                    onConnect={onConnect}
                  >
                    {' '}
                    <Background color="#aaa" gap={16} />
                  </ReactFlow>
                  <div className="absolute bottom-0 right-0">
                    {' '}
                    {/* Position for Controls */}
                    <Controls />
                  </div>
                  <DotsMobileStepper
                    steps={nodes.length}
                    activeStep={activeStep}
                    handleNext={() =>
                      handleStepChange(
                        Math.min(activeStep + 1, nodes.length - 1)
                      )
                    }
                    handleBack={() =>
                      handleStepChange(Math.max(activeStep - 1, 0))
                    }
                  />
                </div>
              </ReactFlowProvider>
            </div>

            {/* Right column for ChatList */}
            <div className="md:w-2/3 grow overflow-auto">
              <ChatList
                messages={messages}
                activeStep={activeStep}
                setActiveStep={handleStepChange}
              />
              <ChatScrollAnchor trackVisibility={isLoading} />
            </div>
          </div>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
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
