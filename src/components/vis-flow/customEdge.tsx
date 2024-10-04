import { BaseEdge, EdgeLabelRenderer, EdgeProps } from "reactflow";
import { FC } from "react";
import { getBezierPath } from "reactflow";
import { Popover, PopoverHandler } from "@material-tailwind/react";

const CustomEdge: FC<EdgeProps> = ({
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
    // console.log("edge data", data)
    return (
        <>
            {/* <BaseEdge id = {id} path={edgePath} style={{...style, strokeDasharray: hasValidPubMedID? '4 0': '4 4'}} /> */}
            <BaseEdge path={edgePath} style={{...style, strokeDasharray: '4 4'}} />
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
                            {``}
                             {/* <span className="border-l border-gray-400 px-[2px] text-gray-600 text-sm">
                                <i className={`fas fa-regular ${iconClass} px-1`} />
                                {num_papers}
                            </span> */}
                        </div>
                    </PopoverHandler>
                </Popover>
            </EdgeLabelRenderer>
        </>
    )
}

export default CustomEdge