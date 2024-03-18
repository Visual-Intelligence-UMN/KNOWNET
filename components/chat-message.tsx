// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'

import { categoryColorMapping, cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { IconOpenAI, IconUser } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'
import { CustomGraphNode } from '@/lib/types'
import { tailwindColorMapping } from '@/lib/utils'

export interface ChatMessageProps {
  message: Message
  nodes: CustomGraphNode[]
  clickedNode: any
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
          categoryColorMapping[category] ? '' : 'text-gray-600 bg-gray-100'

        if (isNodeClicked) {
          // Additional styles for clicked node
          tailwindClasses += ' font-bold border-2 border-black'
        }

        // processedContent = processedContent.replace(
        //   highlightRegex,
        //   `<mark class="${tailwindClasses}">$1</mark>`
        // )
        processedContent = processedContent.replace(
          highlightRegex,
          `<mark class="${tailwindClasses}" style="background-color:${categoryColorMapping[category]}; color: black">$1</mark>`
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
