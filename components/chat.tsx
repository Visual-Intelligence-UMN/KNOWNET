'use client'
import {
  ReactFlow,
  Edge,
  Node,
  Position,
  EdgeTypes,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  OnConnect,
  Background,
  Controls
} from 'reactflow'
import 'reactflow/dist/style.css'
import React, { use, useCallback } from 'react'
import { useChat, type Message } from 'ai/react'
import {
  IconRefresh,
  IconStop,
} from '@/components/ui/icons'
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
import DotsMobileStepper from '@/components/dotstepper'
import { Spinner } from '@material-tailwind/react'
import { useAtom } from 'jotai'
import {
  recommendationsAtom,
  backendDataAtom,
  keywordsListAnswerAtom,
  keywordsListQuestionAtom
} from '@/lib/state'
import { fetchBackendData } from '@/lib/utils'
import dagre from 'dagre'

import "./reactflow_custom.css"
import CustomEdge from './customEdge'
// const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'

// Initialize dagre graph for layout calculations
const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))
const nodeWidth = 172
const nodeHeight = 36

// Function to apply dagre layout to nodes and edges
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target)
  })
  dagre.layout(dagreGraph)

  nodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = isHorizontal ? 'left' : 'top'
    node.sourcePosition = isHorizontal ? 'right' : 'bottom'
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2
    }
  })

  return { nodes, edges }
}


const updateStyle = (nodes, edges, activeStep: number) => {
  nodes.forEach(node => {
    node.style = node.step === activeStep ? { opacity: 1 } : { opacity: 0.6 }
  })
  edges.forEach(edge => {
    edge.style = edge.step === activeStep ? { opacity: 1 } : { opacity: 0.4 }
  })
  return { nodes, edges }
}


export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  keywordsListAnswer?: string[]
  keywordsListQuestion?: string[]
}

export function Chat({
  id,
  initialMessages // keywordsListAnswer,
  // className
} // keywordsListQuestion,
: ChatProps) {
  var reloadFlag = useRef(false) // This is a flag to check if the reload button has been clicked. Not use state as it will not trigger a re-render
  const [recommendations, setRecommendations] = useAtom(recommendationsAtom)
  const [backendData, setBackendData] = useAtom(backendDataAtom)
  const [keywordsAnswer, setKeywordsAnswer] = useAtom(keywordsListAnswerAtom)
  const [keywordsQuestion, setKeywordsListQuestion] = useAtom(
    keywordsListQuestionAtom
  )

  const router = useRouter()
  const path = usePathname()
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )

  const initialRender = useRef(true)
  const [previewTokenDialog, setPreviewTokenDialog] = useState(false)
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')
  const [isLoadingBackendData, setIsLoadingBackendData] = useState(false)
  const { messages, append, reload, stop, isLoading, input, setInput, setMessages } =
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
        if (reloadFlag.current) {
          reloadFlag.current = false
        } else if (messages.length !== 0) 
        {
          setActiveStep(activeStep + 1)
        }
      },
      onFinish(message) {
        if (!path.includes('chat')) {
          router.push(`/chat/${id}`, { shallow: true })
          router.refresh()
        }
        if (
          message.role === 'assistant' &&
          processedMessageIds.has(message.id) === false
        ) {
          setProcessedMessageIds(
            prevIds => new Set([...Array.from(prevIds), message.id])
          )
        }

        console.log('Chat Full completion:', message) // Ensure this logs the expected completion

        const parts = message.content.split(' || ')
        const firstPart = parts[0]
        const secondPart = parts[1] || ''
        const thirdPart = parts[2] || ''

        // Debugging the parts
        console.log('Chat First Part:', firstPart)
        console.log('Chat Second Part:', secondPart)
        console.log('Chat Third Part:', thirdPart)

        // Adjusting the regex pattern to be more flexible
        const newkeywordsListAnswer =
          secondPart.match(/\[(.*?)\]/)?.[1].split(' | ') || []
        const newkeywordsListQuestion =
          thirdPart.match(/\[(.*?)\]/)?.[1].split(' | ') || []
        setKeywordsAnswer(newkeywordsListAnswer)
        setKeywordsListQuestion(newkeywordsListQuestion)

        console.log('set Chat Keywords List Answer:', keywordsAnswer)
        console.log('set Chat Keywords List Question:', keywordsQuestion)
        if (recommendations.length === 0) {
          firstConversation(newkeywordsListAnswer, newkeywordsListQuestion)
        }
        router.refresh()
      }
    })

  useEffect(() => {
    if (initialRender.current) {
      const tokenSet = localStorage.getItem('has-token-been-set') === 'true'
      setPreviewTokenDialog(!tokenSet)
      initialRender.current = false
    }
  }, [])


  useEffect(() => {
    if (messages.length > 0) {
    const newMessages = messages
    newMessages[messages.length - 1]['content'] = messages[messages.length - 1]['content'].split('||')[0]
    setMessages(newMessages)
  }
}, [isLoading])

  const handleSaveToken = () => {
    setPreviewToken(previewTokenInput)
    localStorage.setItem('has-token-been-set', 'true') // Directly update local storage
    setPreviewTokenDialog(false)
  }

  // Helper function to convert backend data to React Flow nodes and edges

  const convertDataToFlowElements = (
    data: { vis_res: any[] },
    currentStep: any
  ) => {
    const nodes: {
      id: any
      data: { label: any }
      position: { x: number; y: number }
      type: string
      style: React.CSSProperties
      step: any
    }[] = []
    const edges: {
      id: string
      source: any
      target: any
      label: any
      type: string
      style: React.CSSProperties
      data : {
        'papers':{[key: string]: string[]} 
      }// key is the edge relation, value is the url link
      step: any
    }[] = []
    const nodeIds = new Set()
    const edgeIds = new Set()

    if (!data || !data.vis_res) {
      console.warn('Data is not in the expected format or is null:', data)
      return { nodes, edges }
    }

    data.vis_res.forEach(graph => {
      graph.nodes.forEach((node: { Node_ID: string; Name: any }) => {
        if (!nodeIds.has(node.Node_ID)) {
          nodes.push({
            id: node.Node_ID.toString(),
            data: { label: node.Name },
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            type: 'default',
            style: { opacity: 1 },
            step: currentStep,
          })
          nodeIds.add(node.Node_ID)
        }
      })

      graph.edges.forEach(
        (
          edge: {
            Source: { toString: () => any }
            Target: { toString: () => any }
            PubMed_ID: string
            Type: any
          },
          index: any
        ) => {
          // const edgeId = `e${edge.Source}-${edge.Target}-${edge.Type}`
          const edgeId = `e${edge.Source}-${edge.Target}`
          if (!edgeIds.has(edgeId)) {
            edges.push({
              id: edgeId,
              source: edge.Source.toString(),
              target: edge.Target.toString(),
              label: edge.Type, // use the first edge type as label
              data: {papers: { [edge.Type]: [edge.PubMed_ID]}},
              // type: 'smoothstep',
              type: 'custom',
              step: currentStep,
              style: { opacity: 1 },
            })
            edgeIds.add(edgeId)
          }else {
            var existEdge = edges.find(e=>e.id === edgeId)
            if (existEdge!['data']['papers'][edge.Type] ){
              existEdge!['data']['papers'][edge.Type].push(edge.PubMed_ID)
            }else {
              existEdge!['data']['papers'][edge.Type] = [edge.PubMed_ID]
            }
          }
        }
      )
    })

    return { nodes, edges }
  }

  // Use the generated nodes and edges as initial states
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [layoutDirection, setLayoutDirection] = useState('TB') // Default to top-bottom
  const [activeStep, setActiveStep] = useState(0)

  const [processedMessageIds, setProcessedMessageIds] = useState(new Set())

  // Function to update the layout of the graph
  const updateLayout = useCallback(
    (direction = layoutDirection) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    },
    [nodes, edges, setNodes, setEdges, layoutDirection]
  )

  // Example integration: Call updateLayout when a new message is added
  // This is a simplified example. You'll need to adjust it based on your actual message handling logic.
  useEffect(() => {
    // Assuming you have a mechanism to detect when new messages are added
    // and those messages are converted to nodes and edges accordingly
    updateLayout()
  }, [nodes.length])

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = updateStyle(
      nodes,
      edges,
      activeStep
    )
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  },
    [activeStep]
  )

  

  const appendDataToFlow = useCallback(
    (newData: { vis_res: any[] }, currentStep: any) => {
      const { nodes: newNodes, edges: newEdges } = convertDataToFlowElements(
        newData,
        currentStep
      )

      setNodes(currentNodes => {
        const updatedNodes = [...currentNodes]
        newNodes.forEach(newNode => {
          if (!updatedNodes.find(node => node.id === newNode.id)) {
            updatedNodes.push({
              ...newNode,
              position: { x: Math.random() * 400, y: Math.random() * 400 },
              step: currentStep
            })
          }
        })
        return updatedNodes
      })

      setEdges(currentEdges => {
        const updatedEdges = [...currentEdges]
        newEdges.forEach(newEdge => {
          if (!updatedEdges.find(edge => edge.id === newEdge.id)) {
            updatedEdges.push({ ...newEdge, step: currentStep })
          }
        })
        return updatedEdges
      })
    },
    [setNodes, setEdges]
  )

  const continueConversation = async (
    recommendId: number,
    keywordsAnswer: string[],
    keywordsQuestion: string[]
  ) => {
    setIsLoadingBackendData(true)
    setActiveStep(activeStep + 1)
    const payload = {
      input_type: 'continue_conversation',
      userId: id,
      data: {
        recommendId: recommendId,
        keywords_list_answer: keywordsAnswer,
        keywords_list_question: keywordsQuestion
      }
    }

    const data = await fetchBackendData(payload)
    if (data) {
      setBackendData(data)
      console.log('Continued Data:', data)
    }
    setIsLoadingBackendData(false)
  }

  // Handler for dot stepper change, adjusted for dynamic steps
  const handleStepChange = useCallback((step: number) => {
    setActiveStep(step)
  }, [])

  useEffect(() => {
    console.log(`Current active step: ${activeStep}`)
    console.log(
      'Filtered Nodes:',
      nodes.filter(node => node.step <= activeStep)
    )
    console.log(
      'Filtered Edges:',
      edges.filter(edge => edge.step <= activeStep)
    )
  }, [activeStep])

  const proOptions = { hideAttribution: true }
  const onConnect: OnConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )

  const firstConversation = async (
    keywordsAnswer: string[],
    keywordsQuestion: string[]
  ) => {
    setIsLoadingBackendData(true) // Set loading to true when the request is made
    // setActiveStep(activeStep + 1)
    const payload = {
      input_type: 'new_conversation',
      userId: id,
      data: {
        keywords_list_answer: keywordsAnswer,
        keywords_list_question: keywordsQuestion
      }
    }

    const data = await fetchBackendData(payload)
    if (data) {
      setBackendData(data)
      console.log('First Data:', data)
    }
    setIsLoadingBackendData(false) // Set loading to false when the request is complete
  }

  useEffect(() => {
    if (backendData && backendData.data && backendData.data.vis_res) {
      appendDataToFlow(backendData.data, activeStep)
      setRecommendations(backendData.data.recommendation)
      // appendDataToFlow(testBackendData.data)
    }
  }, [backendData, appendDataToFlow, setRecommendations, activeStep])

  useEffect(() => {
    // Perform actions based on updated keywordsAnswer and keywordsQuestion
    console.log('Keywords Answer Updated:', keywordsAnswer)
    console.log('Keywords Question Updated:', keywordsQuestion)
  }, [keywordsAnswer, keywordsQuestion])


  const StopRegenerateButton = isLoading ? 
    <Button
      variant="outline"
      onClick={() => stop()}
      className='absolute right-6  z-10'
    >
      <IconStop className="mr-2" /> Stop
    </Button> : 
    <Button
      variant="outline"
      onClick={() => {reloadFlag.current = true;reload(); }}
      // className="justify-self-center"
      className='absolute right-6 z-10 '
    >
      <IconRefresh className="mr-2" /> Regenerate
    </Button>

  const customEdgeTypes: EdgeTypes = {
    custom: CustomEdge
  }

  return (
    <>
      <div className=" max-w-[100vw]  rounded-lg border bg-background p-4 ">
        {messages.length ? (
          <>
            {/* DotsMobileStepper positioned here */}
            <DotsMobileStepper
              messages={messages}
              steps={messages.length / 2}
              activeStep={activeStep}
              handleNext={() =>
                handleStepChange(Math.min(activeStep + 1, nodes.length - 1))
              }
              handleBack={() => handleStepChange(Math.max(activeStep - 1, 0))}
              jumpToStep={handleStepChange}
            />

            <div className="md:flex pt-4 md:pt-10">
              {/* {%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%} */}
              {/* left column for visualization */}
              {/* {%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%} */}
              <div className="md:w-2/3 top-10 space-y-1 pr-4">
                {' '}
                {/* Adjust the padding-right (pr-4) as needed */}
                {/* <div className="top-4 h-[calc(40vh-1rem)]">
                <GraphCard graphData={graphData} />
              </div> */}
                <ReactFlowProvider>
                  <div
                    className="sticky top-3 left-10 pb-10 border rounded-md shadow-md bg-white dark:bg-gray-800"
                    style={{
                      width: 'calc(100% - 2rem)',
                      height: 'calc(65vh - 1rem)'
                    }}
                  >
                    { (isLoadingBackendData || isLoading ) && (
                      <div className="absolute inset-0 bg-white bg-opacity-50 flex justify-center items-center z-10">
                        <Spinner color="blue" />
                      </div>
                    )} 

                    <ReactFlow
                      nodes={nodes.filter(node => node.step <= activeStep)}
                      edges={edges.filter(edge => edge.step <= activeStep)}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      fitView
                      proOptions={proOptions}
                      onConnect={onConnect}
                      edgeTypes={customEdgeTypes}
                    >
                      <Background color="#aaa" gap={16} />
                    </ReactFlow>
                    
                    <div className="m-2 flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setLayoutDirection('TB')
                          updateLayout('TB')
                        }}
                      >
                        Top-Bottom Layout
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setLayoutDirection('LR')
                          updateLayout('LR')
                        }}
                      >
                        Left-Right Layout
                      </Button>
                    </div>
                    <div className="absolute bottom-0 right-0">
                      <Controls />
                    </div>
                  </div>
                </ReactFlowProvider>
              </div>

              {/* Right column for ChatList */}
              <div className="md:w-1/3 grow overflow-auto">
                <ChatList
                  messages={messages}
                  activeStep={activeStep}
                />
                {StopRegenerateButton}
                <ChatScrollAnchor trackVisibility={isLoading} />
                
              </div>
            </div>

            <ChatPanel
              id={id}
              isLoading={isLoading || isLoadingBackendData}
              activeStep={activeStep}
              stop={stop}
              append={append}
              reload={reload}
              messages={messages}
              input={input}
              setInput={setInput}
              continueConversation={continueConversation}
              // recommendation={backendData.data.recommendation}
            />
          </>
        ) : (
          <EmptyScreen setInput={setInput} id={id!} append={append} />
        )}
      </div>
     

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
