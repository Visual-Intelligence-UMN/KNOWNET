import React, { FC } from 'react'
import {
  Typography,
  Popover,
  PopoverHandler,
  PopoverContent
} from '@material-tailwind/react'
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge
} from 'reactflow'

const CustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  label
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  const links = Object.keys(data.papers).map(key => {
    const urls = data['papers'][key].filter(
      (url: string | null) => url !== 'None' && url != null
    ) // Exclude 'None' and undefined
    if (urls.length === 0) return [] // Skip categories with no valid URLs
    return (
      <span key={key}>
        <span className="font-bold">{key.toLocaleLowerCase()}</span> in{' '}
        {urls.length} papers :
        {urls.slice(0, 3).map((url: React.Key | null | undefined) => (
          <a
            key={url}
            href={`https://pubmed.ncbi.nlm.nih.gov/${url}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fas fa-solid fa-arrow-up-right-from-square px-1" />
          </a>
        ))}
        {urls.length > 3 && '...'}
        <br />
      </span>
    )
  })

  const tooltipContent = (
    <div className="w-80">
      <Typography color="blue-gray" className="font-medium">
        {data.targetName} -&gt; {data.sourceName}
      </Typography>
      <Typography
        variant="small"
        color="blue-gray"
        className="font-normal opacity-80"
      >
        {links}
      </Typography>
    </div>
  )

  const num_papers = Object.values(data.papers).reduce(
    (acc, val) => acc + val.filter(url => url !== 'None' && url != null).length, // Only count valid URLs
    0
  )

  // Determine the icon based on whether there's at least one valid PubMed_ID across all edges
  const hasValidPubMedID = Object.values(data.papers).some(urls =>
    urls.some(url => url !== 'None' && url != null)
  )
  const iconClass = hasValidPubMedID ? 'fa-circle-check' : 'fa-circle-question'

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{...style, strokeDasharray: hasValidPubMedID? '4 0': '4 4'}} />
      <EdgeLabelRenderer>
        <Popover>
          <PopoverHandler>
            <div
              style={{
                ...style,
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) scale(0.8)`,
                backgroundColor: 'white',
                pointerEvents: 'all',
                cursor: 'pointer'
              }}
              className="nodrag nopan"
            >
              {label!.toString().toLowerCase()}
              {` `}
              <span className="border-l border-gray-400 px-[2px] text-gray-600 text-sm">
                <i className={`fas fa-regular ${iconClass} px-1`} />
                {num_papers}
              </span>
            </div>
          </PopoverHandler>
          <PopoverContent>{tooltipContent}</PopoverContent>
        </Popover>
      </EdgeLabelRenderer>
    </>
  )
}

export default CustomEdge
