import { type Message } from 'ai'

import { Node as ReactFlowNode } from 'reactflow'
export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
  keywordsListAnswer: string[]
  keywordsListQuestion: string[]
}

export type ServerActionResult<Result> = Promise<Result | { error: string }>

export interface CustomGraphNode extends ReactFlowNode {
  Node_ID: string // Node ID is now a string
  Label: string
  group: string
  Name: string
  CUI?: string
  step?: number
}

export interface CustomGraphEdge {
  Source: string // Source and target are now strings
  Target: string
  Type: string // Including the type of relationship
  PubMed_ID: string // PubMed ID for the relation
  step?: number
}

export interface VisualizationResult {
  nodes: CustomGraphNode[]
  edges: CustomGraphEdge[]
}

export interface Recommendation {
  id: number
  text: string
}

export interface BackendData {
  data: {
    recommendation: Recommendation[]
    vis_res: VisualizationResult[]
    node_name_mapping: { [KGName: string]: string } // naming KG name to GPT name
  }
  keywords_list_answer: string[]
  keywords_list_question: string[]
  message: string
  status: string
}
