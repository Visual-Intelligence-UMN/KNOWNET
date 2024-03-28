import React, { FC, useContext, useEffect, useState } from 'react'
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
import { recommendationsAtom } from '@/lib/state'
import { useAtom } from 'jotai'
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
  const [globalRecommendations] = useAtom(recommendationsAtom)
  const [visibleRecommendations, setVisibleRecommendations] = useState<
    Recommendation[]
  >([])

  // Initialize or update visibleRecommendations based on globalRecommendations
  useEffect(() => {
    const filteredRecommendations = data.recommendations.filter(
      recommendation =>
        globalRecommendations.some(
          globalRec =>
            globalRec.id === recommendation.id &&
            recommendation.text
              .toLowerCase()
              .includes(data.label?.toLowerCase())
        )
    )
    setVisibleRecommendations(filteredRecommendations)
  }, [data.recommendations, globalRecommendations])

  const handleRecommendationClick = (recommendation: Recommendation) => {
    globalOnRecommendationClick(recommendation)
    // Optionally hide the clicked recommendation by updating visibleRecommendations
    setVisibleRecommendations(prev =>
      prev.filter(rec => rec.id !== recommendation.id)
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
        {visibleRecommendations.length > 0 && (
          <NodeToolbar
            isVisible={data.selected}
            position={Position.Bottom}
            offset={1}
          >
            <div className="text-xs">Tell me more about:</div>
            {visibleRecommendations.map(recommendation => (
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
