import { type Message } from 'ai'

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

export interface GraphNode {
  id: string // Node ID is now a string
  label: string
  group: string
  CUI?: string
}

export interface GraphEdge {
  source: string // Source and target are now strings
  target: string
  type?: string // Including the type of relationship
  PubMed_ID?: string // PubMed ID for the relation
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface VisualizationResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphModalProps {
  isOpen: boolean
  onClose: () => void
  graphData: GraphData
}

export interface Recommendation {
  id: number
  text: string
}
