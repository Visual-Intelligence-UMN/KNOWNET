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
  ReactFlowInstance
} from 'reactflow'
import 'reactflow/dist/style.css'
import React, {
  use,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef
} from 'react'
import { useChat, type Message } from 'ai/react'
import { IconRefresh, IconStop } from '@/components/ui/icons'
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
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'
import { usePathname, useRouter } from 'next/navigation'
import DotsMobileStepper from '@/components/dotstepper'
import { useAtom } from 'jotai'
import {
  recommendationsAtom,
  backendDataAtom,
  keywordsListAnswerAtom,
  keywordsListQuestionAtom,
  gptTriplesAtom
} from '@/lib/state'
import { fetchBackendData, categoryColorMapping, highLevelNodes } from '@/lib/utils'
import dagre from 'dagre'
import FlowComponent from './vis-flow'
import { BackendData, CustomGraphEdge, CustomGraphNode } from '@/lib/types'
// const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'

// Initialize dagre graph for layout calculations
const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))
const nodeWidth = 172
const nodeHeight = 36

// Function to apply dagre layout to nodes and edges
const getLayoutedElements = (
  nodes: CustomGraphNode[],
  edges: CustomGraphEdge[],
  direction = 'TB'
) => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target)
  })
  dagre.layout(dagreGraph)

  const { minX, minY, maxX, maxY } = nodes.reduce(
    (acc, node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      const nodeMinX = nodeWithPosition.x - nodeWidth / 2
      const nodeMinY = nodeWithPosition.y - nodeHeight / 2
      const nodeMaxX = nodeWithPosition.x + nodeWidth / 2
      const nodeMaxY = nodeWithPosition.y + nodeHeight / 2
      return {
        minX: Math.min(acc.minX, nodeMinX),
        minY: Math.min(acc.minY, nodeMinY),
        maxX: Math.max(acc.maxX, nodeMaxX),
        maxY: Math.max(acc.maxY, nodeMaxY)
      }
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  )

  const graphWidth = maxX - minX + nodeWidth
  const graphHeight = maxY - minY + nodeHeight

  const offsetX = (window.innerWidth - graphWidth) / 2
  const offsetY = (window.innerHeight - graphHeight) / 2

  nodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = isHorizontal ? Position.Left : Position.Top
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2 - offsetX,
      y: nodeWithPosition.y - nodeHeight / 2 - offsetY
    }
  })

  return { nodes, edges }
}

const updateStyle = (nodes: any[], edges: any[], activeStep: number) => {
  nodes.forEach(node => {
    const currentOpacity = node.step === activeStep ? 1 : 0.6
    // Update only the opacity, preserving other style properties including background color
    node.style = { ...node.style, opacity: currentOpacity }
  })

  edges.forEach(edge => {
    edge.style = {
      ...edge.style,
      opacity: edge.step === activeStep ? 1 : 0.4
    }
  })

  return { nodes, edges }
}

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  keywordsListAnswer?: string[]
  keywordsListQuestion?: string[]
}

export function Chat({ id, initialMessages }: ChatProps) {
  var reloadFlag = useRef(false) // This is a flag to check if the reload button has been clicked. Not use state as it will not trigger a re-render
  const [recommendations, setRecommendations] = useAtom(recommendationsAtom)
  const [backendData, setBackendData] = useAtom(backendDataAtom)
  const [keywordsAnswer, setKeywordsAnswer] = useAtom(keywordsListAnswerAtom)
  const [keywordsQuestion, setKeywordsQuestion] = useAtom(
    keywordsListQuestionAtom
  )
  const [gptTriples, setGptTriples] = useAtom(gptTriplesAtom)

  const router = useRouter()
  const path = usePathname()
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null)

  const initialRender = useRef(true)
  const [previewTokenDialog, setPreviewTokenDialog] = useState(false)
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')
  const [isLoadingBackendData, setIsLoadingBackendData] = useState(true)
  const {
    messages,
    append,
    reload,
    stop,
    isLoading,
    input,
    setInput,
    setMessages
  } = useChat({
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
      } else if (messages.length !== 0) {
        setActiveStep(activeStep => activeStep + 1)
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
      const secondPart: string[][] = JSON.parse(parts[1] || '') // a list of triplets, Array<[source, relation, target]>
      const thirdPart: string[] = JSON.parse(parts[2] || '') // a list of entities

      // // Debugging the parts
      // console.log('Chat First Part:', firstPart)
      // console.log('Chat Second Part:', secondPart)
      // console.log('Chat Third Part:', thirdPart)

      // Adjusting the regex pattern to be more flexible
      // const newkeywordsListAnswer =
      //   secondPart.match(/\[(.*?)\]/)?.[1].split(' | ') || []
      // const newkeywordsListQuestion =
      //   thirdPart.match(/\[(.*?)\]/)?.[1].split(' | ') || []


      setGptTriples(secondPart.map((d: string[]) => [d[0], d[1], d[2], activeStep]))

      const newkeywordsListAnswer = [... new Set(secondPart.map((d: string[]) => [d[0], d[2]]).flat())]
      const newkeywordsListQuestion = thirdPart
      setKeywordsAnswer(newkeywordsListAnswer)
      setKeywordsQuestion(newkeywordsListQuestion)

      // console.log('set Chat Keywords List Answer:', keywordsAnswer)
      // console.log('set Chat Keywords List Question:', keywordsQuestion)
      if (recommendations.length === 0) {
        firstConversation(newkeywordsListAnswer, newkeywordsListQuestion)
      }
      router.refresh()
    }
  })

  const withFetchBackendData = async (payload: any) => {
    setIsLoadingBackendData(true)
    const data = await fetchBackendData(payload)
    console.info('Backend Data:', data)
    return data
  }

  useEffect(() => {
    if (initialRender.current) {
      const tokenSet = localStorage.getItem('has-token-been-set') === 'true'
      setPreviewTokenDialog(!tokenSet)
      initialRender.current = false
    }
  }, [])

  // useEffect(() => {
  //   if (messages.length > 0) {
  //     const newMessages = messages
  //     newMessages[messages.length - 1]['content'] =
  //       messages[messages.length - 1]['content'].split('||')[0]
  //     setMessages(newMessages)
  //   }
  // }, [isLoading])

  const handleSaveToken = () => {
    setPreviewToken(previewTokenInput)
    localStorage.setItem('has-token-been-set', 'true') // Directly update local storage
    setPreviewTokenDialog(false)
  }

  // Helper function to convert backend data to React Flow nodes and edges

  const convertBackendDataToFlowElements = (
    data: BackendData['data'],
    currentStep: number
  ) => {
    const nodes: CustomGraphNode[] = []
    const edges: CustomGraphEdge[] = []
    const nodeIds = new Set()
    const edgeIds = new Set()

    if (!data || !data.vis_res) {
      console.warn('Data is not in the expected format or is null:', data)
      return { nodes, edges }
    }

    data.vis_res.forEach(graph => {
      graph.nodes.forEach(node => {
        if (!nodeIds.has(node.id)) {
          const nodeColor = categoryColorMapping[node.category] || categoryColorMapping['NotFind']  // White as default color
          nodes.push({
            id: node.id,
            data: {
              label: node.name,
              kgName: node.name,
              gptName: data.node_name_mapping[node.name]
            },
            position: { x: 0, y: 0 },
            type: 'default',
            category: node.category,
            style: {
              opacity: 1,
              background: nodeColor,
            },
            step: currentStep
          })
          nodeIds.add(node.id)
        }
      })

      graph.edges.forEach((edge, index: any) => {
        // const edgeId = `e${edge.Source}-${edge.Target}-${edge.Type}`
        const edgeId = `e${edge.source}-${edge.target}`
        const edgeRevId = `e${edge.target}-${edge.source}`
        if (!edgeIds.has(edgeId) && !edgeIds.has(edgeRevId)) {
          edges.push({
            id: edgeId,
            source: edge.source,
            target: edge.target,
            label: edge.category, // use the first edge type as label
            data: { papers: { [edge.category]: [edge.PubMed_ID] }, sourceName: graph.nodes.find(n => n.id === edge.source)?.name, targetName: graph.nodes.find(n => n.id === edge.target)?.name},
            // type: 'smoothstep',
            type: 'custom',
            step: currentStep,
            style: { opacity: 1 }
          })
          edgeIds.add(edgeId)
        } else {
          var existEdge = edges.find(e => e.id === edgeId)
          if (existEdge!['data']['papers'][edge.category]) {
            existEdge!['data']['papers'][edge.category].push(edge.PubMed_ID)
          } else {
            existEdge!['data']['papers'][edge.category] = [edge.PubMed_ID]
          }
        }
      })
    })
    setIsLoadingBackendData(false)
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
        getLayoutedElements(
          nodes as CustomGraphNode[],
          edges as CustomGraphEdge[],
          direction
        )
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)

      if (reactFlowInstance) {
        setTimeout(() => reactFlowInstance.fitView(), 0)
      }
    },
    [nodes, edges, setNodes, setEdges, layoutDirection, reactFlowInstance]
  )

  useEffect(() => {
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
  }, [activeStep])

  const appendDataToFlow = useCallback(
    (newData: BackendData['data'], currentStep: any) => {
      const { nodes: newNodes, edges: newEdges } = convertBackendDataToFlowElements(
        newData,
        currentStep
      )

      const mergeNodes = (currentNodes: any[], newNodes: CustomGraphNode[]) => {
        const mergedNodes = [...currentNodes]
        newNodes.forEach(newNode => {
          if (!mergedNodes.find(node => node.id === newNode.id)) {
            mergedNodes.push({
              ...newNode,
              position: { x: Math.random() * 400, y: Math.random() * 400 },
              step: currentStep
            })
          }
        })
        return mergedNodes
      }


      setNodes(currentNodes => {
        const updatedNodes = mergeNodes(currentNodes, newNodes).filter(node=> !highLevelNodes.some(d=> {node.data.label.includes(d)}))
        // const uniqueNodes:string[] = [...new Set(gptTriples.map((triple, i) => ([triple[0], triple[2]])).flat())]
        // uniqueNodes.forEach(node => {
        //   if (!updatedNodes.find(n => n['data']['gptName'].toLowerCase() === node.toLowerCase())) {
        //     updatedNodes.push({
        //       id: node,
        //       data: { label: node, kgName: '', gptName: node },
        //       position: { x: Math.random() * 400, y: Math.random() * 400 },
        //       type: 'default',
        //       category: 'NotFind',
        //       style: {
        //         opacity: 1,
        //         background: categoryColorMapping['NotFind']
        //       },
        //       step: currentStep,
        //     })
        //   }
        // })
        return updatedNodes
      })

      setEdges(currentEdges => {
        const updatedEdges = [...currentEdges]
        newEdges.forEach(newEdge => {
          const edgeId = `e${newEdge.source}-${newEdge.target}`
          const edgeRevId = `e${newEdge.target}-${newEdge.source}`
          if (!updatedEdges.find(edge => edge.id === edgeId || edge.id === edgeRevId)) {
            updatedEdges.push({ ...newEdge, step: currentStep })
          }
        })

      //   const updatedNodes = mergeNodes(nodes, newNodes)

      //   gptTriples.forEach((triple, i) => {
      //   const [source, relation, target] = triple
      //   const sourceNode = updatedNodes.find(node => node.data.gptName.toLowerCase() === source.toLowerCase())
      //   const targetNode = updatedNodes.find(node => node.data.gptName.toLowerCase() === target.toLowerCase())
      //   if (sourceNode && targetNode) {
      //     const edgeId = `e${sourceNode.id}-${targetNode.id}`
      //     const edgeRevId = `e${targetNode.id}-${sourceNode.id}`
      //     var findEdgeIndex = updatedEdges.findIndex(edge => edge.id === edgeId || edge.id === edgeRevId)
      //     if (findEdgeIndex === -1) {
      //       updatedEdges.push({
      //         id: edgeId,
      //         source: sourceNode.id,
      //         target: targetNode.id,
      //         label: relation,
      //         data: { papers: { [relation]: [] } },
      //         type: 'custom',
      //         category: 'NotFind',
      //         step: currentStep,
      //         style: { opacity: 1 }
      //       })
      //     }else{
      //       updatedEdges[findEdgeIndex]['label'] = relation
      //     }
      //   }
      //   if (!targetNode || !sourceNode){
      //     const s = sourceNode?sourceNode.id:source, t = targetNode?targetNode.id:target
      //     updatedEdges.push({
      //       id: `e${s}-${t}`,
      //       source: s,
      //       target: t,
      //       label: relation,
      //       data: { papers: { [relation]: [] } },
      //       type: 'custom',
      //       category: 'NotFind',
      //       step: currentStep,
      //       style: { opacity: 1 }
      //     })
      //   }
      // })

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
    // setActiveStep(activeStep => activeStep + 1)
    const payload = {
      input_type: 'continue_conversation',
      userId: id,
      data: {
        recommendId: recommendId,
        keywords_list_answer: keywordsAnswer,
        keywords_list_question: keywordsQuestion
      }
    }

    const data = await withFetchBackendData(payload)
    if (data) {
      setBackendData(data)
      console.log('Continued Data:', data)
    }
  }

  // Handler for dot stepper change, adjusted for dynamic steps
  const handleStepChange = useCallback((step: number) => {
    setActiveStep(step)
  }, [])

  // useEffect(() => {
  //   console.log(`Current active step: ${activeStep}`)
  //   console.log(
  //     'Filtered Nodes:',
  //     nodes.filter(node => node.step <= activeStep)
  //   )
  //   console.log(
  //     'Filtered Edges:',
  //     edges.filter(edge => edge.step <= activeStep)
  //   )
  // }, [activeStep])

  const proOptions = { hideAttribution: true }
  const onInit = setReactFlowInstance

  const onConnect: OnConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )

  const firstConversation = async (
    keywordsAnswer: string[],
    keywordsQuestion: string[]
  ) => {
    // setActiveStep(activeStep + 1)
    const payload = {
      input_type: 'new_conversation',
      userId: id,
      data: {
        keywords_list_answer: keywordsAnswer,
        keywords_list_question: keywordsQuestion
      }
    }

    const data = await withFetchBackendData(payload)
    if (data) {
      setBackendData(data)
      console.log('First Data:', data)
    }
  }

  useEffect(() => {
    if (backendData && backendData.data && backendData.data.vis_res) {
      appendDataToFlow(backendData.data, activeStep)
      setRecommendations(backendData.data.recommendation)

      // appendDataToFlow(testBackendData.data)
    }
  }, [backendData, appendDataToFlow, setRecommendations, activeStep])

  // useEffect(() => {
  //   // Perform actions based on updated keywordsAnswer and keywordsQuestion
  //   console.log('Keywords Answer Updated:', keywordsAnswer)
  //   console.log('Keywords Question Updated:', keywordsQuestion)
  //   console.info('GPT Triples:', gptTriples.current)
  // }, [keywordsAnswer, keywordsQuestion])

  const StopRegenerateButton = isLoading ? (
    <Button
      variant="outline"
      onClick={() => stop()}
      className="relative left-[60%]"
    >
      <IconStop className="mr-2" /> Stop
    </Button>
  ) : (
    <Button
      variant="outline"
      onClick={() => {
        reloadFlag.current = true
        reload()
      }}
      className="relative left-[60%]"
    >
      <IconRefresh className="mr-2" /> Regenerate
    </Button>
  )

  useEffect(() => {
    const handleResize = () => {
      updateLayout()
    }

    window.addEventListener('resize', handleResize)

    // This effect's cleanup function
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [updateLayout])

  const [clickedNode, setClickedNode] = useState(null)

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

               {/* Left column for ChatList */}
               <div className="md:w-1/3 grow overflow-auto">
                <ChatList
                  messages={messages}
                  activeStep={activeStep}
                  gptTriples={gptTriples}
                  nodes={nodes}
                  edges={edges}
                  clickedNode={clickedNode}
                />
                {StopRegenerateButton}
                <ChatScrollAnchor trackVisibility={isLoading} />
              </div>

              {/* {%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%} */}
              {/* Right column for visualization */}
              {/* {%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%} */}
              <div className="md:w-2/3 top-10 space-y-1 pr-4">
                <ReactFlowProvider>
                  <FlowComponent
                    {...{
                      nodes,
                      edges,
                      onNodesChange,
                      onEdgesChange,
                      activeStep,
                      proOptions,
                      onConnect,
                      onInit,
                      isLoadingBackendData,
                      isLoading,
                      updateLayout,
                      setLayoutDirection,
                      setClickedNode,
                      recommendations
                    }}
                  />
                </ReactFlowProvider>
              </div>

             
            </div>
          </>
        ) : (
          <EmptyScreen setInput={setInput} id={id!} append={append} />
        )}
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
          firstConversation={firstConversation}
        />
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
