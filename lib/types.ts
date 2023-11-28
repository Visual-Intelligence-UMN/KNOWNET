import { type Message } from 'ai'

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Node {
  id: number
  label: string
  group: string
}

export interface Edge {
  source: number
  target: number
}

export interface GraphData {
  nodes: Node[]
  edges: Edge[]
}

export interface GraphModalProps {
  isOpen: boolean
  onClose: () => void
  graphData: GraphData
}
