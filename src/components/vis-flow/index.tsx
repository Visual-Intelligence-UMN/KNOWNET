import React from "react";
import { useEffect, useRef, useState } from "react";
import {Background, ReactFlow, useReactFlow } from "reactflow";
import CustomEdge from "./customEdge";
import CustomNode from "./customNode";
import FlowContext from "./flow-context";
import { gptTriplesAtom } from "../../lib/state";
import { categoryColorMapping } from "../../lib/utils";
import { useAtom } from "jotai";
import { Button } from "../ui/button";
import { Spinner } from "@material-tailwind/react";
import { Node,Edge } from "reactflow";

const nodesTypes = {
    custom: CustomNode
}

const edgeTypes = {
    custom: CustomEdge
}

const FlowComponent = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    proOptions,
    onConnect,
    onInit,
    isLoadingBackendData,
    isLoading,
    setClickedNode,
    setLayoutDirection,
    updateLayout,
    continueConversation,
    id,
    append,
    activeStep

}: {
    nodes: any
    edges: any
    onNodesChange: any
    onEdgesChange: any
    proOptions: any
    onConnect: any
    onInit: any
    isLoadingBackendData: any
    isLoading: any
    setClickedNode: any,
    setLayoutDirection: any
    updateLayout: any,
    continueConversation?: (recommendId: number, triples: string[][]) => void,
    id: any,
    append: any,
    activeStep: any

}) => {
    const reactFlowInstance = useReactFlow()
    const [gptTriples] = useAtom(gptTriplesAtom)
    const gptTriplesRef = useRef(gptTriples)
    const [totalRecommendations, setTotalRecommendations] = useState(0)

    useEffect(() => {
        gptTriplesRef.current = gptTriples
    }, [gptTriples])
    


    useEffect(() => {
        // Function to adjust view
        const adjustView = () => {
          // Ensure the instance is available
          if (reactFlowInstance) {
            // Fit view to include all nodes initially
            reactFlowInstance.fitView({ padding: 0.2 })
    
            // Assuming you want to zoom in to the new nodes (with opacity 1) after fitting view
            const newNodes = nodes.filter(node => node.style?.opacity === 1)
            if (newNodes.length > 0) {
              // Example logic to zoom into the area of new nodes
              // Adjust according to your app's logic
              const x = newNodes[0].position.x // Simplified, consider calculating the center or a specific target
              const y = newNodes[0].position.y
            }
          }
        }
    
        adjustView()
      }, [nodes.length, reactFlowInstance])

    const handleonNodeClick = async (event: any, node: any) => {
        // Set hovered node id in a state that's accessible by the chat component
        setClickedNode(node)
    }
    
    const handleonNodeDoubleClick = () => {
    // Clear hovered node id
        setClickedNode(null)
    }
    const onRecommendationClick = async (recommendation: any) => {
        // Handle recommendation button click
        if (recommendation) {
          await append({
            id,
            content: 'Can you tell me more about ' + recommendation.text + '?',
            role: 'user'
          })
          const recommendationId = recommendation.id
          // Use the current value of the refs, which is always up-to-date
          const gptTriples = gptTriplesRef.current
          // Assuming you have a way to trigger the continueConversation method from here
          // You may need to lift state up or use a global state management solution
          if (continueConversation) {
            continueConversation(recommendationId, gptTriples)
          }
        }
    }
    



    return (

        <FlowContext.Provider value={{ onRecommendationClick }}>
            <div className="sticky top-3 left-10 pb-10 border rounded-md shadow-md bg-white dark:bg-gray-800"
                style={{
                width: 'calc(100% - 2rem)',
                height: 'calc(65vh - 1rem)'
                }}>
                {isLoading && nodes.length === 0 && (
                    <div className="absolute inset-0 bg-white bg-opacity-[65%] flex flex-wrap justify-center items-center z-10 p-[150px]">
                        <div className="text-gray-700 text-[20px]">
                            Wait for GPT responding...
                        </div>
                    </div>
                )}

                {isLoadingBackendData && !isLoading && (
                        <div className="absolute inset-0 bg-white bg-opacity-[85%] flex flex-wrap justify-center items-center z-10 p-[150px]">
                            <Spinner color="blue" className="h-[60px] w-[60px]" />
                            <div className="basis-full h-0"></div>
                            <div className="text-gray-700 text-[20px]">
                            Waiting loading data from backend knowledge graph...
                            <br />
                            Searching 162,213 nodes and 1,017,319 edges...
                            </div>
                        </div>
                )}

                <ReactFlow
                    nodes = {
                        nodes
                            .filter(node => node.step <= activeStep)
                            .map(node => ({
                            ...node,
                            style: {
                                backgroundColor: categoryColorMapping[node.category] || '#cccccc',
                                borderRadius: 6,
                                padding: 0,
                                color: '#000',
                                fontWeight: 500,
                                fontSize: 14
                            }
                            }))
                        }

                    edges = {edges.filter(edge => edge.step <= activeStep)}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    proOptions={proOptions}
                    onConnect={onConnect}
                    onInit={onInit}
                    edgeTypes={edgeTypes}
                    nodeTypes={nodesTypes}
                    onNodeClick={handleonNodeClick}
                    onNodeDoubleClick={handleonNodeDoubleClick}
                >
                    <Background color="#aaa" gap={16} />
                </ReactFlow>
                
                <div className="m-2 gap-3 flex justify-between items-center">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setLayoutDirection('TB')
                            updateLayout('TB')
                        }}>
                        Top-Bottom Layout
                    </Button>
                    {totalRecommendations > 0 && (<div className="w-1/3 justify-between">Recommendation</div>)}
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
            </div>

        </FlowContext.Provider>
        
    )
}
export default FlowComponent