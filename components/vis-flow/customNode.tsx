import React, { FC } from 'react'
import {
  Node as ReactFlowNode,
  Handle,
  Position,
  NodeToolbar,
  NodeProps
} from 'reactflow'
import { Button } from '../ui/button' // Adjust the import path as necessary
import 'reactflow/dist/style.css'
import { CustomGraphNode } from '@/lib/types'
export interface Recommendation {
  id: number
  text: string
}
const handleRecommendationClick = (recommendation: Recommendation) => {
  console.log('Recommendation clicked:', recommendation)
  // Implement your logic to handle the recommendation click here
  // This might involve setting state, fetching more data, etc.
}

const CustomNode: FC<NodeProps> = ({
  id,
  sourcePosition,
  targetPosition,
  data
}) => {
  const isRecommended = (label: string) => {
    return data.recommendations.some(recommendation =>
      recommendation.text.toLowerCase().includes(label.toLowerCase())
    )
  }
  return (
    <>
      <div
        style={{
          overflow: 'hidden',
          borderColor: '#1A192B',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '5px',
          boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.07)',
          padding: '10px',
          minWidth: '150px',
          minHeight: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          boxSizing: 'border-box'
        }}
      >
        {isRecommended(data.label) && (
          <NodeToolbar
            isVisible={data.selected}
            position={Position.Bottom}
            offset={1}
          >
            {data.recommendations.length > 0 && (
              <div className="text-xs">Tell me more about:</div>
            )}
            {data.recommendations.map(recommendation => (
              <Button
                key={recommendation.id}
                variant="outline"
                className="mr-2" // Add some spacing between buttons
                onClick={() => handleRecommendationClick(recommendation)}
                title={recommendation.text}
              >
                {recommendation.text
                  .replace(data.label, '')
                  .replace(' and ', '')}
              </Button>
            ))}
          </NodeToolbar>
        )}

        <div className="reactflow">{data.label}</div>

        <Handle type="target" position={targetPosition || Position.Top} />
        <Handle type="source" position={sourcePosition || Position.Bottom} />
      </div>
    </>
  )
}

export default CustomNode
