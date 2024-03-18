// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { IconOpenAI, IconUser } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'
import { CustomGraphNode } from '@/lib/types'

export interface ChatMessageProps {
  message: Message
  nodes: CustomGraphNode[]
  clickedNode: any
}
const labelColorMapping: { [key: string]: string } = {
  'Dietary Supplement': '#4e79a7', // Blue
  Disorders: '#f28e2c', // Orange
  Drug: '#e15759', // Red
  'Genes & Molecular Sequences': '#76b7b2', // Cyan
  Anatomy: '#59a14f', // Green
  'Living Beings': '#edc949', // Yellow
  Physiology: '#af7aa1', // Purple
  'Chemicals & Drugs': '#ff9da7', // Pink
  Procedures: '#9c755f', // Brown
  'Activities & Behaviors': '#bab0ab', // Gray
  'Concepts & Ideas': '#4e79a7', // Blue
  Device: '#f28e2c', // Orange
  Object: '#e15759', // Red
  Organization: '#76b7b2', // Cyan
  Phenomenon: '#59a14f' // Green
  // Add more label types and colors as needed
}

// const tailwindColorMapping: { [key: string]: string } = {
//   'Dietary Supplement': 'text-blue-600 bg-blue-200', // Example mapping
//   Disorders: 'text-orange-600 bg-orange-200', // Continue mapping other categories...
//   Drug: 'text-red-600 bg-red-200',
//   'Genes & Molecular Sequences': 'text-cyan-600 bg-cyan-200',
//   Anatomy: 'text-green-600 bg-green-200',
//   'Living Beings': 'text-yellow-600 bg-yellow-200',
//   Physiology: 'text-purple-600 bg-purple-200',
//   'Chemicals & Drugs': 'text-pink-600 bg-pink-200',
//   Procedures: 'text-brown-600 bg-brown-200',
//   'Activities & Behaviors': 'text-gray-600 bg-gray-200',
//   'Concepts & Ideas': 'text-blue-600 bg-blue-200',
//   Device: 'text-orange-600 bg-orange-200',
//   Objects: 'text-red-600 bg-red-200',
//   Object: 'text-red-600 bg-red-200',
//   Organization: 'text-cyan-600 bg-cyan-200',
//   Phenomenon: 'text-green-600 bg-green-200'
//   // Add more mappings as needed
// }

export const tailwindColorMapping: { [key: string]: string } = {
  'Dietary Supplement': 'bg-blue-200', // Example mapping
  Disorders: 'bg-orange-200', // Continue mapping other categories...
  Drug: 'bg-red-200',
  'Genes & Molecular Sequences': 'bg-cyan-200',
  Anatomy: 'bg-green-200',
  'Living Beings': 'bg-yellow-200',
  Physiology: 'bg-purple-200',
  'Chemicals & Drugs': 'bg-pink-200',
  Procedures: 'bg-brown-200',
  'Activities & Behaviors': 'bg-gray-200',
  'Concepts & Ideas': 'bg-blue-200',
  Device: 'bg-orange-200',
  Objects: 'bg-red-200',
  Object: 'bg-red-200',
  Organization: 'bg-cyan-200',
  Phenomenon: 'bg-green-200'
  // Add more mappings as needed
}

export function ChatMessage({
  message,
  nodes,
  clickedNode,
  ...props
}: ChatMessageProps) {
  // New function to color text based on nodes data
  // function colorTextBasedOnNodes(content: string, nodes: any[] | undefined) {
  //   let processedContent = content
  //   if (!nodes) {
  //     // If nodes is undefined or not an array, return the original content without modification
  //     return processedContent
  //   }
  //   nodes.forEach(node => {
  //     if (node.data?.label) {
  //       const highlightTerm = node.data.label.replace(/s$/, 's?')
  //       const highlightRegex = new RegExp(`(${highlightTerm})`, 'gi')

  //       let tailwindClasses =
  //         tailwindColorMapping[
  //           node.label as keyof typeof tailwindColorMapping
  //         ] || 'text-gray-600 bg-gray-100' // Default styling

  //       processedContent = processedContent.replace(
  //         highlightRegex,
  //         `<mark class="${tailwindClasses}">$1</mark>`
  //       )
  //     }
  //   })
  //   return processedContent
  // }

  // let processedContent = colorTextBasedOnNodes(message.content, nodes)
  // function preprocessMarkdownContent(
  //   content: string,
  //   highlightTerm: string | null,
  //   category: string | null
  // ) {
  //   if (!highlightTerm || !category) return content // Skip if no term or category

  //   // This is a simple approach and might need further refinement for more complex variations
  //   const adjustedHighlightTerm = highlightTerm.replace(/s$/, 's?')
  //   const highlightRegex = new RegExp(`(${adjustedHighlightTerm})`, 'gi')

  //   // Use Tailwind classes for styling
  //   let tailwindClasses =
  //     tailwindColorMapping[category as keyof typeof tailwindColorMapping] ||
  //     'text-gray-600 bg-gray-100' // Default styling
  //   if (clickedNode?.data?.label === highlightTerm) {
  //     // Add classes for bold text and dashed line frame
  //     tailwindClasses += ' font-bold border-dashed border-2 border-gray-400'
  //   }

  //   return content.replace(
  //     highlightRegex,
  //     `<mark class="${tailwindClasses}">$1</mark>`
  //   )
  // }
  // // Check if clickedNode and clickedNode.data are not null before accessing clickedNode.data.label
  // // Usage before rendering with ReactMarkdown
  // // Assume clickedNode could be null, adjust the call accordingly

  // const highlightTerm = clickedNode?.data?.label ?? null
  // const category = clickedNode?.label ?? null
  // processedContent = preprocessMarkdownContent(
  //   message.content,
  //   highlightTerm,
  //   category
  // )
  // Consolidated function to apply styles based on nodes and clickedNode
  function processContent(content: string, nodes: CustomGraphNode[], clickedNode: any) {
    if (!nodes) {
      return content
    }

    let processedContent = content

    nodes.forEach(node => {
      if (node.data?.gptName) {
        const gptName = node.data.gptName
        const highlightRegex = new RegExp(`(${gptName})`, 'gi')
        const isNodeClicked = clickedNode?.data?.gptName === gptName
        const category = node.category
        let tailwindClasses =
          tailwindColorMapping[category] || 'text-gray-600 bg-gray-100'

        if (isNodeClicked) {
          // Additional styles for clicked node
          tailwindClasses += ' font-bold border-2 border-black'
        }

        processedContent = processedContent.replace(
          highlightRegex,
          `<mark class="${tailwindClasses}">$1</mark>`
        )
      }
    })

    return processedContent
  }

  let processedContent = processContent(message.content, nodes, clickedNode)
  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex size-10 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'user'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'user' ? <IconUser /> : <IconOpenAI />}
      </div>
      <div
        className={cn(
          'flex-1 min-w-0 px-1 ml-4 space-y-2 overflow-hidden',
          message.role === 'assistant'
            ? 'overflow-y-auto max-h-96'
            : 'overflow-y-hidden'
        )}
      >
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw as any]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 cursor-default animate-pulse">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {processedContent || message.content}
        </MemoizedReactMarkdown>
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}
