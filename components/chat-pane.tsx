import React from 'react'
import { Message } from 'ai'
import { ChatMessage } from '@/components/chat-message'

export interface ChatPaneProps {
  messagePair: [Message, Message?]
}

export const ChatPane: React.FC<ChatPaneProps> = ({ messagePair }) => {
  return (
    <div className="chat-pane mx-auto px-14">
      {messagePair.map(
        (message, index) =>
          message && <ChatMessage key={index} message={message} />
      )}
    </div>
  )
}
