'use Client'
import { ChatPanel } from './chat-panel.tsx';
import { useChat } from 'ai/react';
import { useLocalStorage } from '../lib/hooks/use-local-storage.ts';
import { toast } from 'react-hot-toast';
import { type Message } from 'ai/react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EmptyScreen } from './empty-screen.tsx';
import { ChatList } from './chat-list.tsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { ViewModeProvider } from './ui/view-mode.tsx';
import {OnEdgesChange, ReactFlowProvider} from 'reactflow'
import { ChatScrollAnchor } from './chat-scroll-anchors.tsx';
import { CustomGraphNode, CustomGraphEdge, BackendData} from '../lib/types.ts';
import Slider from './chat-slider.tsx';
import { 
  useNodesState,
  Position,
  ReactFlowInstance,
  useEdgesState,
  OnConnect,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge
} from 'reactflow';
import dagre from 'dagre'
import { useAtom } from 'jotai';
import { gptTriplesAtom, recommendationsAtom, backendDataAtom} from '../lib/state.ts';
import { fetchBackendData, highLevelNodes, categoryColorMapping} from '../lib/utils.tsx';
import FlowComponent from './vis-flow/index.tsx';
import {Node, Edge} from 'reactflow'
import { uptime } from 'process';

import FlowTest from './vis-flow/flow.tsx';
import { Button } from './ui/button.tsx';
import { IconRefresh, IconStop } from './ui/icons.tsx';
import 'reactflow/dist/style.css'

// Initialize dagre graph for layout calculations
const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))
const nodeWidth = 172
const nodeHeight = 86
// previous nodeHeight = 36

const getLayoutedElements = (
  nodes: CustomGraphNode[],
  edges: CustomGraphEdge[],
  direction = 'TB'
) => {
  // console.log("initial nodes", nodes)
  // console.log("getLayoutedEdges", edges)

  const isHorizontal = direction === 'LR'

  dagreGraph.setGraph({ rankdir: direction })
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target)
  })
  dagre.layout(dagreGraph)
  // console.log("dagre layout", dagreGraph)

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
  initialMessages?: Message[];
  id?: string;
}

export function Chat({ id, initialMessages }: ChatProps) {
  const reloadFlag = useRef(false);
  const initialRender = useRef(true)


  // preview Token Related Below
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')

  const [previewTokenDialog, setPreviewTokenDialog] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();

  // Recommendations relatied below
  const [recommendations, setRecommendations] = useAtom(recommendationsAtom)
  const recommendationMaxLen = useRef(0)


  // React Flow Related Below: 
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null)

  const [gptTriples, setGptTriples] = useAtom(gptTriplesAtom)
  const gptTriplesRef = useRef(gptTriples)
  const [backendData, setBackendData] = useAtom(backendDataAtom)
  const [isLoadingBackendData, setIsLoadingBackendData] = useState(true)


  const extractRelations = (
    text: string
  ): { relations: Array<Array<string>> } => {
    // Define the patterns to match entities and relations
    const entityPattern = /\[([^\]]+)\]\(\$N(\d+)\)/g
    const relationPattern = /\[([^\]]+)\]\((\$R\d+), (.+?)\)/g
  
    // Extract entities and map their codes to names
    let entityMatch: RegExpExecArray | null
    const entities: { [key: string]: string } = {}
  
    while ((entityMatch = entityPattern.exec(text)) !== null) {
      const [_, name, code] = entityMatch
      entities[`$N${code}`] = name
    }
  
    // Process the relation strings, now correctly handling multiple relations per match
    let relationMatch: RegExpExecArray | null
    const outputRelations: Array<Array<string>> = []
  
    while ((relationMatch = relationPattern.exec(text)) !== null) {
      const [_, relationName, relationCode, relationDetails] = relationMatch
      const details = relationDetails.split(';')
  
      details.forEach(detail => {
        const entityCodes = detail
          .trim()
          .split(', ')
          .map(code => code.trim())
  
        // Adjusted to handle relations correctly, including undefined entities
        if (entityCodes.every(code => entities[code] !== undefined)) {
          // Check if all entity codes are defined
          const entity1Name = entities[entityCodes[0]]
          const entity2Name = entities[entityCodes[1]]
          outputRelations.push([entity1Name, relationName, entity2Name])
        } else {
          // Handle undefined entities. Here, just skipping, but could add logic to indicate missing entities
        }
      })
    }
    return { relations: outputRelations }
  }


  const { messages, append, reload, stop, isLoading, input, setInput } = useChat({
    // I can set the endpoint here
    api: 'http://localhost:5175/api/chat',
    initialMessages,
    id,
    body: { id },
    streamProtocol:"text",
    

    onResponse(response) {
      console.log("LLM response received:", response);
      if (response.status === 401) {
        toast.error(response.statusText);
        return;
      }
      if (reloadFlag.current) {
        reloadFlag.current = false;
      } else if (messages.length !== 0) {
        setActiveStep((activeStep) => activeStep + 1);
      }
    },



    // onFinish to log the final message
    onFinish(message) {
      if (!location.pathname.includes('chat')) {
            navigate(`/chat/${id}`, { replace: true });
            // window.location.reload();
          }
      if (message.role === 'assistant' && !processedMessageIds.has(message.id)) {
        setProcessedMessageIds(new Set([...Array.from(processedMessageIds), message.id]));
      }
      // console.log('Finished message:', message);  // Check if the assistant's message is logged
      // navigate(0)

      const parts = message.content.split("||")
      const {relations: triples} = extractRelations(parts[0])
      setGptTriples(triples)

      if (recommendations.length === 0){
          firstConversation(triples)
      }
      // navigate(`/chat/${id}`, { replace: true });
    }
  });
  // an array 
  // console.log("gpt triples:", gptTriples) 


  const withFetchBackendData = async (payload: any) => {
    setIsLoadingBackendData(true)
    const data = await fetchBackendData(payload)
    console.info('Frontend recieved the Backend Data:', data)
    return data
  }

    // get curret GPT Tripples 
  useEffect(() => {
    gptTriplesRef.current = gptTriples
  }, [gptTriples])

  useEffect(() => {
    if (initialRender.current) {
      const tokenSet = localStorage.getItem('has-token-been-set') === 'true'
      setPreviewTokenDialog(!tokenSet)
      initialRender.current = false
    }
  }, [])
  const seenTriples = useRef<Set<string>>(new Set());
  useEffect(() => {
    const latestAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (!latestAssistantMsg) return;

    const parts = latestAssistantMsg.content.split('||');
    const { relations: triples } = extractRelations(parts[0]);

    const newTriples = triples.filter(triple => {
      const key = triple.join('|');
      return !seenTriples.current.has(key);
    });

    if (newTriples.length > 0) {
      newTriples.forEach(t => seenTriples.current.add(t.join('|')));
      setGptTriples(prev => [...prev, ...newTriples]);
    }
  }, [messages]);


  //  Preview Token Check
  // const handleSaveToken = () => {
  //   setPreviewToken(previewTokenInput)
  //   localStorage.setItem('has-token-been-set', 'true') // Directly update local storage
  //   setPreviewTokenDialog(false)
  // }


  const convertBackendDataToFlowElements = (
    data: BackendData["data"],
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
    data.vis_res.nodes?.forEach(node => {
      if (!nodeIds.has(node.id)) {
        const nodeColor =
          categoryColorMapping[node.category] || categoryColorMapping['NotFind'] // White as default color
        nodes.push({
          id: node.id,
          data: {
            label: node.name,
            kgName: node.name,
            gptName: data.node_name_mapping[node.name],
            recommendations: data.recommendation
          },
          position: { x: 0, y: 0 },
          // type: 'default',
          type: 'custom',
          category: node.category,
          style: {
            opacity: 1,
            background: nodeColor,
            borderRadius: '5px'
          },
          step: currentStep
        })
        nodeIds.add(node.id)
      }
    })

    data.vis_res.edges?.forEach((edge, index: any) => {
      // const edgeId = `e${edge.Source}-${edge.Target}-${edge.Type}`
      const edgeId = `e${edge.source}-${edge.target}`
      const edgeRevId = `e${edge.target}-${edge.source}`
      if (!edgeIds.has(edgeId) && !edgeIds.has(edgeRevId)) {
        edges.push({
          id: edgeId,
          source: edge.source,
          target: edge.target,
          label: edge.category, // use the first edge type as label
          data: {
            papers: { [edge.category]: [edge.PubMed_ID] },
            sourceName: data.vis_res.nodes.find(n => n.id === edge.source)
              ?.name,
            targetName: data.vis_res.nodes.find(n => n.id === edge.target)?.name
          },
          // type: 'smoothstep',
          type: 'custom',
          step: currentStep,
          style: { opacity: 1 }
        })
        edgeIds.add(edgeId)
      } else {
        const existEdge = edges.find(e => e.id === edgeId)
        if (existEdge!['data']['papers'][edge.category]) {
          existEdge!['data']['papers'][edge.category].push(edge.PubMed_ID)
        } else {
          existEdge!['data']['papers'][edge.category] = [edge.PubMed_ID]
        }
      }
    })
    setIsLoadingBackendData(false)
    return { nodes, edges }
  }

  const convertGptDataToFlowElements = (
    data: string[][],
    currentStep: number
  ) => {
    const nodes: CustomGraphNode[] = [];
    const edges: CustomGraphEdge[] = [];
    const nodeIds = new Set()
    const edgeIds = new Set()

    if (!data) {
      console.log("No GPT Triple")
      return {nodes, edges}
    }
    data.forEach(([subject, predicate, object], index) => {
      const subjectId = `node-${subject}`
      const objectId = `node-${object}`
      if (!nodeIds.has(subjectId)){
        nodes.push({
          id: subjectId,
          data: {
            label: subject
          },
          position: {x:0, y:0},
          style: {
            opacity: 1,
            // background: nodeColor,
            borderRadius: '5px'
          },
          type: 'custom',
          step: currentStep,
          category: "Objects"
        })

        nodeIds.add(subjectId)
      }
      if(!nodeIds.has(objectId)) {
        nodes.push({
          id: objectId,
          data: {label: object},
          position: {x:0, y:0},
          style: {
            opacity: 1,
            // background: nodeColor,
            borderRadius: '5px'
          },
          type: "custom",
          step: currentStep,
          category: "Objects"
        })
        nodeIds.add(objectId)
      }
      const edgeId = `edge-${subject}-${object}`
      const edgeIdRev = `edge-${object}-${subject}`
      if (!edgeIds.has(edgeId)
        //  && !edgeIds.has(edgeIdRev)
        ) 
        {
        edges.push({
          id: edgeId,
          source: subjectId,
          target: objectId,
          label: predicate,
          // animated: true,
          type: "custom",
          style: { stroke: 'black', opacity: 1 },
          step: currentStep


        })
        edgeIds.add(edgeId)
      }
  });
    setIsLoadingBackendData(false)
    // console.log(nodes, edges)
    // console.log("convert nodes edges", nodes, edges)
    return {nodes, edges}
  }



  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [layoutDirection, setLayoutDirection] = useState('TB') // Default to top-bottom
  const [activeStep, setActiveStep] = useState(0)
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());


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
  }, [reactFlowInstance, nodes, edges])


  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = updateStyle(
      nodes,
      edges,
      activeStep
    )
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [activeStep])


  const appendDataToFlow1 = useCallback(
    // backendData["data"] is a dictionary
    (newData: string[][] , currentStep: any) => {

    const { nodes: newNodes, edges: newEdges } =
      // convertBackendDataToFlowElements(newData, currentStep)
      convertGptDataToFlowElements(newData, currentStep)

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
      const updatedNodes = mergeNodes(currentNodes, newNodes).filter(
        node =>
          !highLevelNodes.some(d => {
            node.data.label?.includes(d)
          })
      )
      // console.log("updated nodes", updatedNodes)
      return updatedNodes
    })

    setEdges(currentEdges => {
      const updatedEdges = [...currentEdges]
      newEdges.forEach(newEdge => {
        const edgeS = newEdge.source.substring(5)
        const edgeT = newEdge.target.substring(5)
        const edgeId = `edge-${edgeS}-${edgeT}`
        const edgeRevId = `edge-${newEdge.target}-${newEdge.source}`
        if (
          !updatedEdges.find(
            edge => edge.id === edgeId 
            // || edge.id === edgeRevId
          )
        ) {
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
    triples: string[][]
    ) => {
    // setActiveStep(activeStep => activeStep + 1)
    const payload = {
      input_type: 'continue_conversation',
      userId: id,
      data: {
        recommendId: recommendId,
        triples
      }
    }
    const data = await withFetchBackendData(payload)
    if (data) {
      setBackendData(data)
      console.log('Continued Data:', data)
    }
  }
  
  const handleStepChange = useCallback((step: number) => {
    setActiveStep(step)
  }, [])

  const proOptions = { hideAttribution: true }
  const onInit = setReactFlowInstance

  const onConnect: OnConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )
  

  const firstConversation = async (triples: string[][]) => {
    const payload = {
      input_type: 'new_conversation',
      userId: id,
      data: {
        triples
      }
    }
    const data = await withFetchBackendData(payload)
    if (data) {
      setBackendData(data)
    }
  }



  useEffect(() => {
    if(gptTriples) {
      appendDataToFlow1(gptTriples, activeStep)
    }
  }, [gptTriples, appendDataToFlow1, activeStep])


  // useEffect(() => {
  //   if (backendData && backendData.data && backendData.data.vis_res) {
  //     appendDataToFlow(backendData.data, activeStep)
  //     // setRecommendations(backendData.data.recommendation)
  //   }
  // }, [backendData, appendDataToFlow, setRecommendations, activeStep])


  // useEffect(() => {
  //   if (
  //     backendData &&
  //     backendData.data &&
  //     backendData.data.recommendation.length >= recommendationMaxLen.current
  //   ) {
  //     recommendationMaxLen.current = recommendations.length
  //   }
  // }, [recommendations])

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

  const r = 18,
    c = Math.PI * (r * 2),
    val = (recommendations.length - 1) / recommendationMaxLen.current,
    pct = val * c

  const circleProgress =
    recommendationMaxLen.current > 0 && recommendations.length >= 0 ? (
      <svg id="svg" width="40" height="40">
        <g transform={`rotate(-90 20 20)`}>
          <circle
            r={r}
            cx="20"
            cy="20"
            fill="transparent"
            strokeDasharray={c}
            strokeDashoffset="0"
            stroke="#aaa"
            strokeWidth="5px"
          ></circle>
          <circle
            id="bar"
            r={r}
            cx="20"
            cy="20"
            fill="transparent"
            strokeDasharray={c}
            strokeDashoffset={pct}
            stroke="#111"
            strokeWidth="5px"
          ></circle>
        </g>
        <text x="50%" y="50%" textAnchor="middle" fontSize="12px" dy=".3em">
          {recommendationMaxLen.current - recommendations.length + 1}/
          {recommendationMaxLen.current}
        </text>
      </svg>
    ) : (
      <></>
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

  // console.log("nodes ready", nodes)
  return (
    <div className="max-w-[100vw] rounded-lg border bg-background p-4">
      {messages.length ? (
        <>
          <div className="md:flex pt-4 md:pt-10">
            <div className="md:w-1/3 grow overflow-auto">
            <ViewModeProvider>
              <ChatList 
                messages={messages}
                activeStep={activeStep}
                nodes={nodes}
                edges={edges}
                clickedNode={clickedNode}
              />
            </ViewModeProvider>
            {activeStep == messages.length / 2 - 1 && StopRegenerateButton}
            <ChatScrollAnchor trackVisibility={isLoading}/>
            </div>

            {/* {%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%} */}
            {/* Right column for visualization */}
            {/* {%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%} */}
            <div className="md:w-2/3 top-10 space-y-1 pr-4">
            
            <div>
          
            </div>
            
            <ReactFlowProvider>
                <FlowComponent
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  proOptions={proOptions}
                  onConnect={onConnect}
                  onInit={onInit}
                  setClickedNode={setClickedNode}
                  updateLayout = {updateLayout}
                  setLayoutDirection={setLayoutDirection}
                  isLoading={isLoading}
                  isLoadingBackendData={isLoadingBackendData}
                  id={id}
                  append={append}
                  activeStep = {activeStep}
                />

                {/* <FlowTest
                  nodes={nodes}
                  edges={edges}
                />  */}

                
              </ReactFlowProvider>
            
            </div>
          </div>
          <div className="flex justify-center items-center pt-3">
            <Slider
                messages={messages}
                steps={messages.length / 2}
                activeStep={activeStep}
                handleNext={() =>
                  handleStepChange(Math.min(activeStep + 1, nodes.length - 1))
                }
                handleBack={() => handleStepChange(Math.max(activeStep - 1, 0))}
                jumpToStep={handleStepChange}
              />
               {circleProgress}
          </div>
        </>
      ) : (
        <EmptyScreen setInput={setInput} id={id!} append={append}  />
      )}
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
    </div>
  );
}
