import React, { FC, useContext, useState } from 'react'
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
import FlowContext from './flow-context'

export interface Recommendation {
  id: number
  text: string
}

const CustomNode: FC<NodeProps> = ({
  id,
  sourcePosition,
  targetPosition,
  data
}) => {
  const { onRecommendationClick: globalOnRecommendationClick } =
    useContext(FlowContext)
  const [hiddenRecommendations, setHiddenRecommendations] = useState<
    Set<number>
  >(new Set())

  const handleRecommendationClick = (recommendation: Recommendation) => {
    // Call the global onRecommendationClick function
    globalOnRecommendationClick(recommendation)
    // Mark this recommendation as hidden
    setHiddenRecommendations(prev => new Set(prev.add(recommendation.id)))
  }

  const isRecommended = (label: string) => {
    return data.recommendations.some(recommendation =>
      recommendation.text.toLowerCase().includes(label.toLowerCase())
    )
  }

  // Directly filter and map over recommendations that contain the node's label and are not hidden
  const filteredRecommendations = data.recommendations.filter(
    recommendation =>
      recommendation.text.toLowerCase().includes(data.label.toLowerCase()) &&
      !hiddenRecommendations.has(recommendation.id)
  )
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
            {filteredRecommendations.length > 0 && (
              <div className="text-xs">Tell me more about:</div>
            )}
            {filteredRecommendations
              .filter(
                recommendation => !hiddenRecommendations.has(recommendation.id)
              )
              .map(recommendation => (
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
