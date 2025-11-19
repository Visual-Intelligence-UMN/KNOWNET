import { EdgeLabelRenderer, EdgeProps } from "reactflow";
import { FC, useState } from "react";
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
  id,
  markerEnd
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  const status = (data as any)?.verification?.status;
  const finalDash =
    status === "missing" ? "2 4" :
    status === "weak"    ? "6 4" :
    undefined;
  const finalWidth =
    status === "verified" || status === "supported" ? 2.5 : 2;

  const [revealed, setRevealed] = useState(false);

  // Optional: allow per-edge delay via data.delay; fallback to a small default
  const edgeDelay = typeof (data as any)?.delay === 'number' ? (data as any).delay : 0.12;

  return (
    <>
      <motion.path
        id={id}
        d={edgePath}
        fill="none"
        strokeLinecap="butt"
        stroke="#000"
        strokeWidth={finalWidth}
        strokeDasharray={revealed ? finalDash : undefined}
        markerEnd={markerEnd as any}
        initial={{ pathLength: 0, opacity: 0.95 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.70, ease: "easeInOut", delay: edgeDelay }}  // was 0.35
        onAnimationComplete={() => setRevealed(true)}
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
