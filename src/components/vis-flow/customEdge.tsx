import { EdgeLabelRenderer, EdgeProps } from "reactflow";
import { FC } from "react";
import { getBezierPath } from "reactflow";
import { Popover, PopoverHandler } from "@material-tailwind/react";
import { motion } from "framer-motion";

const CustomEdge: FC<EdgeProps> = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    data,
    label,
    id
}) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition
    });

    return (
        <>
            <motion.path
                id={id}
                d={edgePath}
                fill="none"
                stroke="black"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                    delay: 0.2 // optional delay for stagger effect
                }}
                style={style}
            />
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
                            {label?.toString().toLowerCase()}
                        </div>
                    </PopoverHandler>
                </Popover>
            </EdgeLabelRenderer>
        </>
    );
};

export default CustomEdge;
