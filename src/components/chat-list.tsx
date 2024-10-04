'use client'
import { Message } from 'ai'
import { useViewMode } from './ui/view-mode'
import { ChatMessage } from './chat-message'
import { CustomGraphNode } from '../lib/types'

export interface ChatListProps {
    messages: Message[]
    activeStep: number
    nodes: CustomGraphNode[]
    edges: CustomGraphEdge[]
    clickedNode: any
  }
  

export function ChatList({
    messages,
    activeStep,
    nodes,
    edges,
    clickedNode,
  }: ChatListProps) {
    const { isPaneView } = useViewMode()
    
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
                  message={message}
                  nodes={message.role=='user'?[]:nodes}
                  edges={message.role=='user'?[]:edges}
                  clickedNode={clickedNode}
                />
              ))}
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                nodes={message.role=='user'?[]:nodes}
                edges={message.role=='user'?[]:edges}
                clickedNode={clickedNode}
              />
            ))}
          </>
        )}
      </div>
    )
  }

export default ChatList