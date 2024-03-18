import { Node as ReactFlowNode } from 'reactflow'

export interface CustomNodeType extends ReactFlowNode {
  step: number
}
