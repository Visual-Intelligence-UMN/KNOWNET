// Import necessary React and React Flow components at the beginning of your file
import React, { useEffect } from 'react'
import {
  ReactFlow,
  Edge,
  Node,
  Position,
  EdgeTypes,
  addEdge,
  useNodesState,
  useEdgesState,
  OnConnect,
  Background,
  Controls,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import CustomEdge from './customEdge' // Ensure this path is correct
import { Button } from './ui/button'
import { Spinner } from '@material-tailwind/react'

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
  activeStep,
  isLoadingBackendData,
  isLoading,
  setLayoutDirection,
  updateLayout
}: {
  nodes: any
  edges: any
  onNodesChange: any
  onEdgesChange: any
  proOptions: any
  onConnect: any
  activeStep: any
  isLoadingBackendData: any
  isLoading: any
  setLayoutDirection: any
  updateLayout: any
}) => {
  const reactFlowInstance = useReactFlow()

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

  return (
    <div
      className="sticky top-3 left-10 pb-10 border rounded-md shadow-md bg-white dark:bg-gray-800"
      style={{
        width: 'calc(100% - 2rem)',
        height: 'calc(65vh - 1rem)'
      }}
    >
      {isLoadingBackendData && (
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
        edgeTypes={edgeTypes}
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
  )
}

export default FlowComponent
