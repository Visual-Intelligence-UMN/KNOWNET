import { type Message } from 'ai'

import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow'
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

export type CustomGraphNode = ReactFlowNode & {
  // Label: string
  // group: string
  data: {
    kgName: string
    gptName: string
    label: string
    recommendations: Recommendation[]
  }
  category: string
  step?: number
}

export type CustomGraphEdge = ReactFlowEdge & {
  // Source: string // Source and target are now strings
  // Target: string
  // Type: string // Including the type of relationship
  step?: number
  data: {
    papers: { [key: string]: string[] }
  } // key is the edge relation, value is the pubmed url link
}

export type KGNode = {
  id: string
  name: string
  category: string
}

export type KGEdge = {
  source: string
  target: string
  category: string
  PubMed_ID: string
}

export interface VisualizationResult {
  nodes: KGNode[]
  edges: KGEdge[]
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
