// Import necessary React and React Flow components at the beginning of your file
import React, { useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import CustomEdge from './customEdge' // Ensure this path is correct
import { Button } from '../ui/button'
import { Spinner } from '@material-tailwind/react'
import { Progress } from '@material-tailwind/react'

// FlowComponent separated from Chat function
// Define custom edge types including your CustomEdge
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
  activeStep,
  isLoadingBackendData,
  isLoading,
  setLayoutDirection,
  updateLayout,
  setClickedNode,
  recommendations
}: {
  nodes: any
  edges: any
  onNodesChange: any
  onEdgesChange: any
  proOptions: any
  onConnect: any
  onInit: any
  activeStep: any
  isLoadingBackendData: any
  isLoading: any
  setLayoutDirection: any
  updateLayout: any
  setClickedNode: any
  recommendations: any
}) => {
  const reactFlowInstance = useReactFlow()
  const [progress, setProgress] = useState(0)
  const [totalRecommendations, setTotalRecommendations] = useState(0)

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
          // setTimeout(
          //   () => reactFlowInstance.setCenter(x, y, { duration: 500 }),
          //   500
          // )
        }
      }
    }

    adjustView()
  }, [nodes, reactFlowInstance])

  const handleonNodeClick = (event: any, node: any) => {
    // Set hovered node id in a state that's accessible by the chat component
    setClickedNode(node)
    console.log('Clicked Node:', node)
  }

  const handleonNodeDoubleClick = () => {
    // Clear hovered node id
    setClickedNode(null)
    console.log('Clicked Node:', null)
  }

  useEffect(() => {
    if (recommendations.length > totalRecommendations) {
      setTotalRecommendations(recommendations.length)
    }
    const exploredRecommendations =
      totalRecommendations - recommendations.length
    const progressPercentage =
      (exploredRecommendations / totalRecommendations) * 100
    setProgress(progressPercentage)
  }, [recommendations, totalRecommendations])

  return (
    <div
      className="sticky top-3 left-10 pb-10 border rounded-md shadow-md bg-white dark:bg-gray-800"
      style={{
        width: 'calc(100% - 2rem)',
        height: 'calc(65vh - 1rem)'
      }}
    >
      {(isLoadingBackendData || isLoading) && (
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
        onInit={onInit}
        edgeTypes={edgeTypes}
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
          }}
        >
          Top-Bottom Layout
        </Button>
        {totalRecommendations > 0 && (
          <div className="w-1/3 justify-between">
            {/* <Typography color="blue-gray" variant="h6">
              {' '}
              Recommendations explored
            </Typography>
            <Typography color="blue-gray" variant="h6">
              {progress.toFixed(0)}
            </Typography> */}

            {/* <span>Knowledge graph explored %</span> */}
            <Progress
              value={Number(progress.toFixed(0))}
              color="green"
              variant="filled"
              size="md"
              // label="Completed"
              className="border border-gray-900/10 bg-gray-900/5 p-0.5 rounded-md"
            />
          </div>
        )}
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
  )
}

export default FlowComponent
