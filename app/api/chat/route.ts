import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id
  // console.log('User ID:', userId)

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    openai.apiKey = previewToken
  }

  const qaPrompt = `
  You are an expert in healthcare domain and need to help user to answer the healthcare related questions.
  Also, please summary the specific entity/terms in your response (the keywords).
  In addition, please identify the specific entity/terms from the question.
  The entities/terms (keywords) can only be the following types: Dietary Supplement, Drugs, Disease, Symptom and Gene.
  Please return your response in three parts: the first part is the answer of the question; the part part is the summarized entities/terms (keywords); the third part is the identified entities/terms from the question.
  Please use " || " to split the three parts.
  Please split the entities/terms (keywords) by " | " if there are more than one, and put them in "[]".
  For example, if the question is "Can Ginkgo biloba prevent Alzheimer's Disease?"
  Your response could be:
  "Gingko biloba is a plant extract...
  Some studies have suggested that Gingko biloba may improve cognitive function and behavior in people with Alzheimer's disease... ||
  [Ginkgo biloba | Alzheimer‘s Disease] || [Ginkgo biloba | Alzheimer‘s Disease]"
  If the question is "What are the benefits of fish oil?"
  Your response could be:
  "Fish oil is known for its rich content of Omega-3 fatty acids... The benefits of Fish Oil: Fish oil can delay or reduce the risk of cognitive decline.
  Fight Inflammation: Omega-3 has potent... || [Fish Oil | Omega-3 fatty acids | cognitive decline | Inflammation] || [Fish Oil]"
  If the question is "Can Coenzyme Q10 prevent Heart disease?"
  Your response could be:
  "Some studies have suggested that Coenzyme Q10 supplementation may have potential benefits for heart health... CoQ10 has antioxidant properties... ||
  [Coenzyme Q10 | heart health || antioxidant] || [Coenzyme Q10 | Heart disease]
    `

  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: qaPrompt
      },
      ...messages.map((message: { role: any; content: any }) => ({
        role: message.role,
        content: message.content
      }))
    ],
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const fullResponse = completion
      console.log('Full completion:', fullResponse) // Ensure this logs the expected completion

      const parts = fullResponse.split(' || ')
      const firstPart = parts[0]
      const secondPart = parts[1] || ''
      const thirdPart = parts[2] || ''

      // Debugging the parts
      console.log('First Part:', firstPart)
      console.log('Second Part:', secondPart)
      console.log('Third Part:', thirdPart)

      // Adjusting the regex pattern to be more flexible
      const keywordsListAnswer =
        secondPart.match(/\[(.*?)\]/)?.[1].split(' | ') || []
      const keywordsListQuestion =
        thirdPart.match(/\[(.*?)\]/)?.[1].split(' | ') || []

      // console.log('Keywords List Answer:', keywordsListAnswer)
      // console.log('Keywords List Question:', keywordsListQuestion)

      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,

          {
            content: firstPart,
            role: 'assistant'
          }
        ],
        keywordsListAnswer,
        keywordsListQuestion
      }
      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })
    }
  })

  return new StreamingTextResponse(stream)
}
