'use client'
import { ChatPanel } from './chat-panel.tsx'
import { useChat } from 'ai/react'
import { useLocalStorage } from '../lib/hooks/use-local-storage.ts'
import { toast } from 'react-hot-toast'
import { type Message } from 'ai/react'
import { usePathname, useRouter } from 'next/navigation'
import {useUIState, useAIState} from 'ai/rsc'
import { ViewModeProvider } from './ui/view-mode.tsx'


import React, {
    useState,
    useRef,
    useEffect
  } from 'react'
// import { useAtom } from 'jotai'
// import {
//     backendDataAtom,
//   } from '@/lib/state'
import { EmptyScreen } from './empty-screen.tsx'
import { ChatList } from './chat-list.tsx'
const stripCategories = (s: string) => s.replace(/\|[^,.;:\n\)\]]+/g, '');

export interface ChatProps extends React.ComponentProps<'div'> {
    initialMessages?: Message[]
    id?: string
    // missingKeys: string[]
  }

// export function Chat0({id}: ChatProps) {
//     const router = useRouter()
//     const path = usePathname()
//     const [input, setInput] = useState('')
//     const [messages] = useUIState()
//     const [aiState] = useAIState()

//     const [_, setNewChatId] = useLocalStorage('newChatId', id)

//     useEffect(() => {
//         if (!path.includes('chat') && messages.length === 1) {
//             window.history.replaceState({}, '', '/chat')
//         }
//     }, [id, path, messages])

//     useEffect(() => {
//         const messagesLength = aiState.messages?.length
//         if (messagesLength === 2) {
//             router.refresh()
//         }
//     }, [aiState.messages, router])

//     useEffect(() => {
//         setNewChatId(id)
//     })

//     return (
//         <>
//             <div className=" max-w-[100vw]  rounded-lg border bg-background p-4 ">
//                 {messages.length? (
//                     <>
//                         <div className="md:flex pt-4 md:pt-10"> 
//                             {/* Left column for ChatList */}
//                             <div className="md:w-1/3 grow overflow-auto">
//                                 <ChatList
//                                     messages={messages}
//                                     // activeStep={activeStep}
//                                 />
//                                 {/* {activeStep == messages.length / 2 - 1 && StopRegenerateButton}
//                                 <ChatScrollAnchor trackVisibility={isLoading} /> */}
//                             </div>
                        
//                             {/* Right column for visualization */}
//                             <div className="md:w-2/3 top-10 space-y-1 pr-4">
//                                 {/* <ReactFlowProvider>
//                                     <FlowComponent
//                                         nodes={nodes}
//                                         edges={edges}
//                                         onNodesChange={onNodesChange}
//                                         onEdgesChange={onEdgesChange}
//                                         activeStep={activeStep}
//                                         proOptions={proOptions}
//                                         onConnect={onConnect}
//                                         onInit={onInit}
//                                         isLoadingBackendData={isLoadingBackendData}
//                                         isLoading={isLoading}
//                                         updateLayout={updateLayout}
//                                         setLayoutDirection={setLayoutDirection}
//                                         setClickedNode={setClickedNode}
//                                         recommendations={recommendations}
//                                         continueConversation={continueConversation}
//                                         id={id}
//                                         append={append}
//                                     />
//                                 </ReactFlowProvider> */}
//                                 visualization
//                             </div>
//                         </div>
//                         {/* below the slider */}
//                         <div className="flex justify-center items-center pt-3 ">
//                             {/* <DotsMobileStepper
//                                 messages={messages}
//                                 steps={messages.length / 2}
//                                 activeStep={activeStep}
//                                 handleNext={() =>
//                                 handleStepChange(Math.min(activeStep + 1, nodes.length - 1))
//                                 }
//                                 handleBack={() => handleStepChange(Math.max(activeStep - 1, 0))}
//                                 jumpToStep={handleStepChange}
//                             />
//                             {circleProgress} */}
//                             slider
//                         </div>
//                     </>
//                 ) : (
//                     <EmptyScreen setInput={setInput} />
//                 )}
                
//                 <ChatPanel
//                     id={id}
//                         //   isLoading={isLoading || isLoadingBackendData}
//                     isLoading={isLoading}
//                     // activeStep={activeStep}
//                     // stop={stop}
//                     // append={append}
//                     // reload={reload}
//                     messages={messages}
//                     input={input}
//                     setInput={setInput}
//                     // continueConversation={continueConversation}
//                     // firstConversation={firstConversation}
//                 />
//             </div>

//         </>
//     )
// }


export function Chat({id, initialMessages}: ChatProps){
    var reloadFlag = useRef(false)
    const initialRender = useRef(true)
    const [previewTokenDialog, setPreviewTokenDialog] = useState(false)
    
    const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
        'ai-token',
        null
    )
    const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')

    // const [activeStep, setActiveStep] = useState(0)
    const [processedMessageIds, setProcessedMessageIds] = useState(new Set())

    // const handleStepChange = useCallback((step: number) => {
    //     setActiveStep(step)
    //   }, [])


    // const [backendData, setBackendData] = useAtom(backendDataAtom)
    // const withFetchBackendData = async (payload: any) => {
    //     setIsLoadingBackendData(true)
    //     const data = await fetchBackendData(payload)
    //     console.info('Backend Data:', data)
    //     return data
    // }
    // const continueConversation = async (
    //     recommendId: number,
    //     triples: string[][]
    //   ) => {
    //     // setActiveStep(activeStep => activeStep + 1)
    //     const payload = {
    //       input_type: 'continue_conversation',
    //       userId: id,
    //       data: {
    //         recommendId: recommendId,
    //         triples
    //       }
    //     }
    //     const data = await withFetchBackendData(payload)
    //     if (data) {
    //       setBackendData(data)
    //       console.log('Continued Data:', data)
    //     }
    //   }
    

    const path = usePathname()
    const router = useRouter()
    const {messages, append, reload, stop, isLoading, input, setInput} = useChat ({
        initialMessages,
        id,
        body: {
            id,
            previewToken
        },
        onResponse(response) {
            if(response.status === 401) {
                toast.error(response.statusText)
            }
            if (reloadFlag.current) {
                reloadFlag.current = false
            } 
            // else if (messages.length !== 0) {
                // setActiveStep(activeStep => activeStep +1)
            // }
        },
        onFinish(message){
            console.log('Chat full completion:', message) 

            if (!path.includes('chat')) {
                router.push(`/chat/${id}`, {shallow:true})
                router.refresh()
            }
            if (
                message.role === 'assistant' && 
                processedMessageIds.has(message.id) === false
            ) {
                setProcessedMessageIds(
                    preInds => new Set([...Array.from(preInds), message.id])
                )
            }
        }
    })
    useEffect(() => {
        if (initialRender.current) {
          const tokenSet = localStorage.getItem('has-token-been-set') === 'true'
          setPreviewTokenDialog(!tokenSet)
          initialRender.current = false
        }
    }, [])
    const displayMessages = React.useMemo(
        () =>
            messages.map(m =>
            m.role === 'assistant'
                ? { ...m, content: stripCategories(m.content) }
                : m
            ),
        [messages]
        );

    const handleSaveToken = () => {
        setPreviewToken(previewTokenInput)
        localStorage.setItem('has-token-been-set', 'true') // Directly update local storage
        setPreviewTokenDialog(false)
    }
    

    return (
        <>
            <div className=" max-w-[100vw]  rounded-lg border bg-background p-4 ">
                {messages.length? (
                    <>
                        <div className="md:flex pt-4 md:pt-10"> 
                            {/* Left column for ChatList */}
                            <div className="md:w-1/3 grow overflow-auto">
                            <ViewModeProvider>
                                <ChatList
                                    messages={displayMessages}
                                    // activeStep={activeStep}
                                />
                            </ViewModeProvider>
                                {/* {activeStep == messages.length / 2 - 1 && StopRegenerateButton}
                                <ChatScrollAnchor trackVisibility={isLoading} /> */}
                            </div>
                        
                            {/* Right column for visualization */}
                            <div className="md:w-2/3 top-10 space-y-1 pr-4">
                                {/* <ReactFlowProvider>
                                    <FlowComponent
                                        nodes={nodes}
                                        edges={edges}
                                        onNodesChange={onNodesChange}
                                        onEdgesChange={onEdgesChange}
                                        activeStep={activeStep}
                                        proOptions={proOptions}
                                        onConnect={onConnect}
                                        onInit={onInit}
                                        isLoadingBackendData={isLoadingBackendData}
                                        isLoading={isLoading}
                                        updateLayout={updateLayout}
                                        setLayoutDirection={setLayoutDirection}
                                        setClickedNode={setClickedNode}
                                        recommendations={recommendations}
                                        continueConversation={continueConversation}
                                        id={id}
                                        append={append}
                                    />
                                </ReactFlowProvider> */}
                                visualization
                            </div>
                        </div>
                        {/* below the slider */}
                        <div className="flex justify-center items-center pt-3 ">
                            {/* <DotsMobileStepper
                                messages={messages}
                                steps={messages.length / 2}
                                activeStep={activeStep}
                                handleNext={() =>
                                handleStepChange(Math.min(activeStep + 1, nodes.length - 1))
                                }
                                handleBack={() => handleStepChange(Math.max(activeStep - 1, 0))}
                                jumpToStep={handleStepChange}
                            />
                            {circleProgress} */}
                            slider
                        </div>
                    </>
                ) : (
                    <EmptyScreen setInput={setInput} />
                )}
                
                <ChatPanel
                    id={id}
                        //   isLoading={isLoading || isLoadingBackendData}
                    isLoading={isLoading}
                    // activeStep={activeStep}
                    stop={stop}
                    append={append}
                    reload={reload}
                    messages={displayMessages}
                    input={input}
                    setInput={setInput}
                    // continueConversation={continueConversation}
                    // firstConversation={firstConversation}
                />
            </div>
            
            {/* Reminder to enter OpenAI Key */}
            {/* <Dialog open={previewTokenDialog} onOpenChange={setPreviewTokenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enter your OpenAI Key</DialogTitle>
                        <DialogDescription>
                        If you have not obtained your OpenAI API key, you can do so by{' '}
                        <a
                            href="https://platform.openai.com/signup/"
                            className="underline"
                        >
                            signing up
                        </a>{' '}
                        on the OpenAI website. This is only necessary for preview
                        environments so that the open source community can test the app.
                        The token will be saved to your browser&apos;s local storage under
                        the name <code className="font-mono">ai-token</code>.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={previewTokenInput}
                        placeholder="OpenAI API key"
                        onChange={e => setPreviewTokenInput(e.target.value)}
                    />
                    <DialogFooter className="items-center">
                        <Button onClick={handleSaveToken}>Save Token</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog> */}

        </>
    )
}