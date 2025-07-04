import { NodeProps, NodeToolbar, Handle, Position } from "reactflow";
import { FC } from "react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";

const CustomNode: FC<NodeProps> = ({
    sourcePosition,
    targetPosition,
    data
}) => {
    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
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
                <NodeToolbar>
                    <Button variant="outline" className="mr-2">
                        recommendation
                    </Button>
                </NodeToolbar>
                <div className="reactflow">{data.label}</div>
                    
                <Handle type="target" position={targetPosition || Position.Top} />
                <Handle type="source" position={sourcePosition || Position.Bottom} />
            </motion.div>
        </>
    )
}
export default CustomNode
