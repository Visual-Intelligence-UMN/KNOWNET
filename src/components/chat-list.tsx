'use client'
import { Message } from 'ai'
import { useViewMode } from './ui/view-mode'
import { ChatMessage } from './chat-message'
import { CustomGraphNode, CustomGraphEdge } from '../lib/types'
import React from 'react'

// Remove trailing keywords FIRST, then inline categories.
// Handles: "|| [ ... ]", "| [ ... ]", and ", "a", "b", ...]" tails.
const stripCategories = (s: string) =>
  s
    // 1) kill trailing keywords blocks
    .replace(/\s*\|\|\s*\[[\s\S]*$|\s*\|\s*\[[\s\S]*$/g, '')
    // 2) fallback: kill a trailing comma+quoted list even if "[" was lost
    .replace(/\s*,\s*"(?:[^"\\]|\\.)+"\s*(?:,\s*"(?:[^"\\]|\\.)+"\s*)*\]?$/g, '')
    // 3) remove inline |Category but NOT the start of a keywords block
    .replace(/\|(?!\s*\[)[^,.;:\n)\]]+/g, '')
    .trim();

export interface ChatListProps {
  messages: Message[]
  activeStep: number
  nodes: CustomGraphNode[]
  edges: CustomGraphEdge[]
  clickedNode: any
}

/**
 * Build a fast lookup from lowercased node label -> node background color.
 * Prefers node.data.bgColor, falls back to node.style.background.
 */
function useLabelToColorMap(nodes: CustomGraphNode[]) {
  return React.useMemo(() => {
    const m = new Map<string, string>()
    for (const n of nodes || []) {
      const label = (n?.data as any)?.label ?? ''
      const key = String(label).toLowerCase().trim()
      const bg =
        (n?.data as any)?.bgColor ||
        (n?.style as any)?.background ||
        ''
      if (key && bg) m.set(key, bg)
    }
    return m
  }, [nodes])
}

export function ChatList({
  messages,
  activeStep,
  nodes,
  edges,
  clickedNode
}: ChatListProps) {
  const { isPaneView } = useViewMode()
  const labelToColor = useLabelToColorMap(nodes)

  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto px-14">
      {isPaneView ? (
        <>
          {messages
            .slice(activeStep * 2, activeStep * 2 + 2)
            .map((message, index) => (
              <ChatMessage
                key={index}
                // For assistant messages: strip trailing JSON/keywords block before render
                message={message.role === 'assistant'
                  ? { ...message, content: stripCategories(message.content) }
                  : message}
                // Only pass nodes/edges to assistant messages (as before)
                nodes={message.role === 'user' ? [] : nodes}
                edges={message.role === 'user' ? [] : edges}
                clickedNode={clickedNode}
                // NEW: provide node-colors so ChatMessage can color chat highlights to match nodes
                labelToColor={labelToColor}
              />
            ))}
        </>
      ) : (
        <>
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message.role === 'assistant'
                ? { ...message, content: stripCategories(message.content) }
                : message}
              nodes={message.role === 'user' ? [] : nodes}
              edges={message.role === 'user' ? [] : edges}
              clickedNode={clickedNode}
              // NEW
              labelToColor={labelToColor}
            />
          ))}
        </>
      )}
    </div>
  )
}

export default ChatList
