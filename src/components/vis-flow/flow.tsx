'use client'

import { useCallback, useState } from 'react'
import ReactFlow, {
  addEdge,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  MiniMap,
  Controls,
  Background
} from 'reactflow'

import 'reactflow/dist/style.css'

export default function FlowTest({
  nodes: initNodes,
  edges: initEdges
}: {
  nodes: Node[]
  edges: Edge[]
}) {
  const [nodes, setNodes] = useState<Node[]>(initNodes)
  const [edges, setEdges] = useState<Edge[]>(initEdges)

  const onNodesChange: OnNodesChange = useCallback(
    chs => {
      setNodes(nds => applyNodeChanges(chs, nds))
    },
    [setNodes]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    chs => {
      setEdges(eds => applyEdgeChanges(chs, eds))
    },
    [setEdges]
  )

  const onConnect: OnConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )
  const proOptions = { hideAttribution: true }
  const minimapStyle = {
    background: '#192633',
    border: '1px solid #192633',
    borderRadius: '4px',

    opacity: 0.8
  }

  // console.log("nodes to display", nodes)

  return (
    <div className="relative" style={{ width: '400px', height: '500px' }}>
      {' '}
      {/* Adjust width and height as needed */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        proOptions={proOptions}
        fitView
      >
        <Background color="#aaa" gap={16} />
      </ReactFlow>
      <div
        className="absolute top-9 left-10"
        style={{ width: '100px', height: '50px' }}
      >
        {' '}
        {/* Position and size for MiniMap */}
        {/* <MiniMap style={minimapStyle} zoomable pannable /> */}
      </div>
      <div className="absolute bottom-0 left-0">
        {' '}
        {/* Position for Controls */}
        <Controls />
      </div>
    </div>
  )
}
