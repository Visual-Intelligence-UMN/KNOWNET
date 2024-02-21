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
  Controls
} from 'reactflow'
import 'reactflow/dist/style.css'
import React, { use, useCallback } from 'react'
import { useChat, type Message } from 'ai/react'
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

// const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'

const testBackendData = {
  data: {
    recommendation: [
      {
        id: 0,
        text: 'coenzyme Q10 and Disorders.'
      },
      {
        id: 1,
        text: 'coenzyme Q10 and Genes & Molecular Sequences.'
      },
      {
        id: 2,
        text: 'coenzyme Q10 and Chemicals & Drugs.'
      },
      {
        id: 3,
        text: 'coenzyme Q10 and Physiology.'
      },
      {
        id: 4,
        text: 'coenzyme Q10 and Living Beings.'
      },
      {
        id: 5,
        text: 'coenzyme Q10 and Anatomy.'
      },
      {
        id: 6,
        text: 'coenzyme Q10 and Dietary Supplement.'
      }
    ],
    vis_res: [
      {
        edges: [
          {
            PubMed_ID: '23221577 | 31687097',
            Relation_ID: 0,
            Source: 0,
            Target: 1,
            Type: 'ASSOCIATED_WITH'
          },
          {
            PubMed_ID: '23221577',
            Relation_ID: 1,
            Source: 0,
            Target: 1,
            Type: 'AFFECTS'
          }
        ],
        nodes: [
          {
            CUI: 'DC0056077',
            Label: 'Dietary Supplement',
            Name: 'coenzyme Q10',
            Node_ID: 0
          },
          {
            CUI: 'C0018802',
            Label: 'Disorders',
            Name: 'Congestive heart failure',
            Node_ID: 1
          },
          {
            CUI: 'DC0056077',
            Label: 'Dietary Supplement',
            Name: 'coenzyme Q10',
            Node_ID: 0
          },
          {
            CUI: 'C0018802',
            Label: 'Disorders',
            Name: 'Congestive heart failure',
            Node_ID: 1
          },
          {
            CUI: 'DC0056077',
            Label: 'Dietary Supplement',
            Name: 'coenzyme Q10',
            Node_ID: 0
          },
          {
            CUI: 'C0018802',
            Label: 'Disorders',
            Name: 'Congestive heart failure',
            Node_ID: 1
          }
        ]
      },
      {
        edges: [
          {
            PubMed_ID: '24593795',
            Relation_ID: 2,
            Source: 0,
            Target: 2,
            Type: 'TREATS'
          }
        ],
        nodes: [
          {
            CUI: 'DC0056077',
            Label: 'Dietary Supplement',
            Name: 'coenzyme Q10',
            Node_ID: 0
          },
          {
            CUI: 'C0011847',
            Label: 'Disorders',
            Name: 'Diabetes',
            Node_ID: 2
          }
        ]
      },
      {
        edges: [
          {
            PubMed_ID: '22005267 | 26232096',
            Relation_ID: 3,
            Source: 3,
            Target: 2,
            Type: 'AFFECTS'
          }
        ],
        nodes: [
          {
            CUI: 'C0920563',
            Label: 'Disorders',
            Name: 'Insulin Sensitivity',
            Node_ID: 3
          },
          {
            CUI: 'C0011847',
            Label: 'Disorders',
            Name: 'Diabetes',
            Node_ID: 2
          },
          {
            CUI: 'C0920563',
            Label: 'Disorders',
            Name: 'Insulin Sensitivity',
            Node_ID: 3
          },
          {
            CUI: 'C0011847',
            Label: 'Disorders',
            Name: 'Diabetes',
            Node_ID: 2
          }
        ]
      }
    ]
  },
  message: 'Chat session retrieved/created successfully',
  status: 'success'
}

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  keywordsListAnswer?: string[]
  keywordsListQuestion?: string[]
}

export function Chat({
  id,
  initialMessages,
  keywordsListAnswer,
  keywordsListQuestion,
  className
}: ChatProps) {
  const [recommendations, setRecommendations] = useAtom(recommendationsAtom)
  const [backendData, setBackendData] = useAtom(backendDataAtom)
  const [keywordsAnswer, setKeywordsAnswer] = useState(keywordsListAnswer)
  const [keywordsQuestion, setKeywordsListQuestion] =
    useState(keywordsListQuestion)

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
          setActiveStep(messages.length / 2)
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
        // if (recommendations.length === 0) {
        //   fetchDataFromBackend()
        // }
        // Update the flow data for the next step
        setActiveStep(messages.length / 2)
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

  // Helper function to convert backend data to React Flow nodes and edges
  // Helper function to convert backend data to React Flow nodes and edges
  const convertDataToFlowElements = (data, currentStep) => {
    const nodes = []
    const edges = []
    const nodeIds = new Set()
    const edgeIds = new Set()

    if (!data || !data.vis_res) {
      console.warn('Data is not in the expected format or is null:', data)
      return { nodes, edges }
    }

    data.vis_res.forEach(graph => {
      graph.nodes.forEach(node => {
        if (!nodeIds.has(node.Node_ID)) {
          nodes.push({
            id: node.Node_ID.toString(),
            data: { label: node.Name },
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            type: 'default',
            step: currentStep
          })
          nodeIds.add(node.Node_ID)
        }
      })

      graph.edges.forEach((edge, index) => {
        const edgeId = `e${edge.Source}-${edge.Target}-${edge.Type}`
        if (!edgeIds.has(edgeId)) {
          edges.push({
            id: edgeId,
            source: edge.Source.toString(),
            target: edge.Target.toString(),
            label: edge.Type,
            type: 'smoothstep',
            style: {
              stroke: `#${Math.floor(Math.random() * 16777215).toString(16)}`
            },
            step: currentStep
          })
          edgeIds.add(edgeId)
        }
      })
    })

    return { nodes, edges }
  }

  // Use the generated nodes and edges as initial states
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [activeStep, setActiveStep] = useState(0)

  const [processedMessageIds, setProcessedMessageIds] = useState(new Set())

  const appendDataToFlow = useCallback(
    (newData, currentStep) => {
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

  const continueConversation = async (recommendId: number) => {
    setIsLoadingBackendData(true)
    setActiveStep(activeStep + 1)
    const payload = {
      input_type: 'continue_conversation',
      userId: id, // Assuming 'id' is the user/session ID you're using
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

  const fetchDataFromBackend = useCallback(async () => {
    setIsLoadingBackendData(true) // Set loading to true when the request is made
    const payload = {
      input_type: 'new_conversation',
      userId: id,
      data: {
        keywords_list_answer: keywordsAnswer,
        keywords_list_question: keywordsQuestion
      }
    }

    try {
      const response = await fetch('http://localhost:5328/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setBackendData(data)

      console.log('First Data:', data)
      // Here you would call the function that integrates the data into your flow, e.g., appendDataToFlow(data);
    } catch (error) {
      console.error('Failed to fetch data from backend:', error)
    } finally {
      setIsLoadingBackendData(false) // Set loading to false when the request is complete
    }
  }, [id, keywordsAnswer, keywordsQuestion])

  useEffect(() => {
    if (backendData && backendData.data && backendData.data.vis_res) {
      appendDataToFlow(backendData.data, activeStep)
      setRecommendations(backendData.data.recommendation)
      // appendDataToFlow(testBackendData.data)
    }
  }, [backendData, appendDataToFlow, setRecommendations])

  useEffect(() => {
    if (keywordsAnswer && keywordsQuestion) {
      if (recommendations.length === 0) {
        fetchDataFromBackend()
      }
    }
  }, [keywordsAnswer, keywordsQuestion])

  return (
    <>
      <div className="mx-auto max-w-4xl  rounded-lg border bg-background p-4 ">
        {messages.length ? (
          <>
            {/* DotsMobileStepper positioned here */}
            <DotsMobileStepper
              steps={messages.length / 2}
              activeStep={activeStep}
              handleNext={() =>
                handleStepChange(Math.min(activeStep + 1, nodes.length - 1))
              }
              handleBack={() => handleStepChange(Math.max(activeStep - 1, 0))}
            />

            <div className="md:flex pt-4 md:pt-10">
              <div className="md:w-1/2 top-10 space-y-1 pr-4">
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
                      height: 'calc(40vh - 1rem)'
                    }}
                  >
                    {isLoadingBackendData ? (
                      <div className="absolute inset-0 bg-white bg-opacity-50 flex justify-center items-center z-10">
                        <Spinner color="blue" />
                      </div>
                    ) : null}
                    <ReactFlow
                      nodes={nodes.filter(node => node.step <= activeStep)}
                      edges={edges.filter(edge => edge.step <= activeStep)}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      fitView
                      proOptions={proOptions}
                      onConnect={onConnect}
                    >
                      <Background color="#aaa" gap={16} />
                    </ReactFlow>

                    <div className="absolute bottom-0 right-0">
                      <Controls />
                    </div>
                  </div>
                </ReactFlowProvider>
              </div>

              {/* Right column for ChatList */}
              <div className="md:w-1/2 grow overflow-auto">
                <ChatList
                  messages={messages}
                  activeStep={activeStep}
                  setActiveStep={handleStepChange}
                />
                <ChatScrollAnchor trackVisibility={isLoading} />
              </div>
            </div>
          </>
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
        continueConversation={continueConversation}
        // recommendation={backendData.data.recommendation}
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
