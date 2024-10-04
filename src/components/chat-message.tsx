import { Message } from "ai";
import { cn } from "../lib/utils";
import { IconOpenAI, IconUser } from "./ui/icons";
import { MemoizedReactMarkdown } from "./markdown";
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { ChatMessageActions } from "./chat-message-action";
import { CodeBlock } from "./ui/codeblock";
import { CustomGraphEdge, CustomGraphNode } from "../lib/types";
import rehypeRaw from 'rehype-raw'
import { categoryColorMapping } from "../lib/utils";

export interface ChatMessageProps {
    message: Message
    nodes: CustomGraphNode[]
    edges: CustomGraphEdge[]
    clickedNode: any
}

export function ChatMessage({ message,nodes, edges,clickedNode, ...props }: ChatMessageProps) {
  function formatText(input: string): string {
    // Pattern to match entities and relations
    
    input = input.split('||')[0]
    // console.log("processed input", input)
    const entityPattern = /\[([^\]]+)]\(\$N\d+\)/g;
    const relationPattern = /\[([^\]]+)]\(\$R\d+, \$N\d+, \$N\d+(?:; \$R\d+, \$N\d+, \$N\d+)*\)/g;
  
    // Replace entities with the new format
    var formattedText = input.replace(entityPattern, '<mark class="node  bg-gray-300">$1</mark>');
  
    // Replace relations with the new format, noting that relations are more complex
    // because they're not directly displayed in the text, only their effects are (e.g., "may improve")
    formattedText = formattedText.replace(relationPattern, '<mark class="rel bg-gray-300 underline">$1</mark>');

    nodes.forEach(node => {
      // console.log(node)
      if (node.data?.gptName) {
        console.log(node)
        const gptName = node.data.gptName
        const highlightRegex = new RegExp(`(${gptName})`, 'gi')
        const isNodeClicked = clickedNode?.data?.gptName === gptName
        const category = node.category
        let tailwindClasses =
          categoryColorMapping[category] ? '' : 'text-gray-600 bg-gray-100'

        if (isNodeClicked) {
          console.log(formattedText)
          // Additional styles for clicked node
          tailwindClasses += ' font-bold border-2 border-black'
        }

        formattedText = formattedText.replace(
          highlightRegex,
          // '#af7aa1'
          `<mark class="${tailwindClasses}" style="background-color:${categoryColorMapping[category]}; color: black">$1</mark>`
          // `<mark class="${tailwindClasses}" style="background-color:${'#af7aa1'}; color: black">$1</mark>`

        )
        // console.log(formattedText)
      }

    })

    return formattedText;
  }
  return (
      <div
        className={cn('group relative mb-4 flex items-start md:-ml-12')}
        {...props}
      >
        <div
          className={cn(
            'flex size-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
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
            rehypePlugins={[rehypeRaw] as any} // Allow raw HTML rendering
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
            {formatText(message.content)}
            {/* {(message.content)} */}
          </MemoizedReactMarkdown>
          <ChatMessageActions message={message} />
        </div>
      </div>
    )
  }