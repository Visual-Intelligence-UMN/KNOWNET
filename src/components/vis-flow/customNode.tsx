import { NodeProps, NodeToolbar, Handle, Position } from "reactflow";
import { FC } from "react";
import { Button } from "../ui/button";

const CustomNode: FC<NodeProps> = ({
    sourcePosition,
    targetPosition,
    data
}) => {
    // console.log("node data", data)
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
                {/* <div className="text-xs">Tell me more about:</div> */}
                <NodeToolbar>
                    <Button
                        // key={recommendation.id}
                        variant="outline"
                        className="mr-2" // Add some spacing between buttons
                        // onClick={() => handleRecommendationClick(recommendation)}
                        // title={recommendation.text}
                    >
                        {/* {recommendation.text
                        .replace(data.label, '')
                        .replace(' and ', '')} */}
                        recommendation
                    </Button>

                </NodeToolbar>
                <div className="reactflow">{data.label}</div>
                    
                <Handle type="target" position={targetPosition || Position.Top} />
                <Handle type="source" position={sourcePosition || Position.Bottom} />
            </div>
        </>
    )
}
export default CustomNode