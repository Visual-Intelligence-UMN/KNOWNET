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
  // const [isGraphModalOpen, setGraphModalOpen] = useState(false)
  // const [graphData, setGraphData] = useState<GraphData>({
  //   nodes: [
  //     { id: 1, label: 'Node 1', group: 'type1' },
  //     { id: 2, label: 'Node 2', group: 'type2' },
  //     { id: 3, label: 'Node 3', group: 'type3' }
  //   ],
  //   edges: [
  //     { source: 1, target: 2 },
  //     { source: 2, target: 3 }
  //   ]
  // })
  // const handleOpenGraphModal = () => {
  //   // Fetch and set the graph data if needed, then open the modal
  //   setGraphModalOpen(true)
  // }

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

  //Flow

  const nodeSize = {
    width: 100,
    height: 40
  }

  // this example uses some v12 features that are not released yet
  // const initialNodes: Node[] = [
  //   {
  //     id: '1',
  //     type: 'input',
  //     data: { label: 'Node 1' },
  //     position: { x: 250, y: 5 },
  //     width: nodeSize.width,
  //     height: nodeSize.height
  //   },
  //   {
  //     id: '2',
  //     data: { label: 'Node 2' },
  //     position: { x: 100, y: 100 },
  //     width: nodeSize.width,
  //     height: nodeSize.height
  //   },
  //   {
  //     id: '3',
  //     data: { label: 'Node 3' },
  //     position: { x: 400, y: 100 },
  //     width: nodeSize.width,
  //     height: nodeSize.height
  //   }
  // ]

  // const initialEdges: Edge[] = [
  //   { id: 'e1-2', source: '1', target: '2', animated: true },
  //   { id: 'e1-3', source: '1', target: '3', animated: true }
  // ]
  // State management for nodes and edges using React Flow's hooks
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [activeStep, setActiveStep] = useState(0)
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set())
  const nodeBank = [
    {
      id: '1',
      data: {
        label: '#ffc800',
        color: '#ffc800'
      },
      position: { x: 0, y: 0 }
    },
    {
      id: '2',
      data: {
        label: '#6865A5',
        color: '#6865A5'
      },
      position: { x: 150, y: 0 }
    },
    {
      id: '3',
      data: {
        label: '#ff6700',
        color: '#ff6700'
      },
      position: { x: 50, y: 100 }
    },
    {
      id: '4',
      data: {
        label: '#0041d0',
        color: '#0041d0'
      },
      position: { x: 200, y: 100 }
    },
    {
      id: '5',
      data: {
        label: '#ff0072',
        color: '#ff0072'
      },
      position: { x: 0, y: 200 }
    },
    {
      id: '6',
      data: {
        label: '#00d7ca',
        color: '#00d7ca'
      },
      position: { x: 150, y: 200 }
    },
    {
      id: '7',
      data: {
        label: '#6ede87',
        color: '#6ede87'
      },
      position: { x: 50, y: 300 }
    },
    {
      id: '8',
      data: {
        label: '#9ca8b3',
        color: '#9ca8b3'
      },
      position: { x: 200, y: 300 }
    }
  ]
  // On initial load, set the nodes to be only the first one visible
  useEffect(() => {
    setNodes(nds => nds.map((node, i) => ({ ...node, hidden: i > activeStep })))
    setEdges(eds => eds.map(edge => ({ ...edge, hidden: true })))
  }, [])
  // Update nodes visibility when activeStep changes
  useEffect(() => {
    setNodes(nds => nds.map((node, i) => ({ ...node, hidden: i > activeStep })))
    setEdges(eds =>
      eds.map(edge => ({
        ...edge,
        hidden:
          parseInt(edge.source) > activeStep ||
          parseInt(edge.target) > activeStep
      }))
    )
  }, [activeStep])

  useEffect(() => {
    messages.forEach(message => {
      if (message.role !== 'user' && !processedMessageIds.has(message.id)) {
        // Randomly select a node from the node bank
        const randomNodeIndex = Math.floor(Math.random() * nodeBank.length)
        const newNode = {
          ...nodeBank[randomNodeIndex],
          id: uuidv4(),
          xstyle: { backgroundColor: nodeBank[randomNodeIndex].data.color }
        } // Clone the node and assign a unique ID

        setNodes(prevNodes => {
          // Check if the node is already added
          if (prevNodes.find(node => node.data.label === newNode.data.label)) {
            return prevNodes
          }

          // Randomly select an existing node to connect with, if there are any
          if (prevNodes.length > 0) {
            const randomExistingNodeIndex = Math.floor(
              Math.random() * prevNodes.length
            )
            const selectedNode = prevNodes[randomExistingNodeIndex]

            // Create a new edge
            const newEdge = {
              id: `e${selectedNode.id}-${newNode.id}`,
              source: selectedNode.id,
              target: newNode.id,
              label: getRandomEdgeText(),
              animated: true
            }

            setEdges(prevEdges => [...prevEdges, newEdge])
          }

          // Return the updated nodes array with the new node
          return [...prevNodes, newNode]
        })

        setProcessedMessageIds(prevIds => new Set([...prevIds, message.id]))
      }
    })
  }, [messages, nodeBank, setNodes, setEdges, processedMessageIds])

  // Handler for dot stepper change
  const handleStepChange = step => {
    setActiveStep(step)
  }
  const proOptions = { hideAttribution: true }
  const minimapStyle = {
    background: '#192633',
    border: '1px solid #192633',
    borderRadius: '4px',

    opacity: 0.8
  }
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
          <div className="md:flex  pt-4 md:pt-10">
            {/* Left column for GraphCard and Flow */}
            <div className="md:w-1/3 space-y-1 pr-4">
              {' '}
              {/* Adjust the padding-right (pr-4) as needed */}
              {/* <div className="top-4 h-[calc(40vh-1rem)]">
                <GraphCard graphData={graphData} />
              </div> */}
              <ReactFlowProvider>
                <div
                  className="sticky top-4 left-4 pb-10"
                  style={{ width: '400px', height: '400px' }}
                >
                  <ReactFlow
                    nodes={nodes.filter((node, i) => i <= activeStep)}
                    edges={edges.filter(edge => !edge.hidden)}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    proOptions={proOptions}
                    onConnect={onConnect}
                  >
                    {' '}
                    <Background color="#aaa" gap={16} />
                  </ReactFlow>
                  {/* <div
                    className="relativ"
                    style={{ width: '10px', height: '10px' }}
                  >
                    <MiniMap style={minimapStyle} zoomable pannable />
                  </div> */}
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
              <ChatList messages={messages} />
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
