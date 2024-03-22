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

  // const qaPrompt = `
  // You are an expert in healthcare domain and need to help user to answer the healthcare related questions.
  // Also, please summary the specific entities in your response (the keywords).
  // In addition, please identify the specific entities from the question.
  // The entities/terms (keywords) can only be the following types: Dietary Supplement, Drugs, Disease, Symptom and Gene.
  // Please return your response in three parts: the first part is the answer of the question; the part part is the summarized entities/terms (keywords); the third part is the identified entities/terms from the question.
  // Please use " || " to split the three parts.
  // Please split the entities/terms (keywords) by " | " if there are more than one, and put them in "[]".
  // For example, if the question is "Can Ginkgo biloba prevent Alzheimer's Disease?"
  // Your response could be:
  // "Gingko biloba is a plant extract...
  // Some studies have suggested that Gingko biloba may improve cognitive function and behavior in people with Alzheimer's disease... ||
  // [Ginkgo biloba | Alzheimer‘s Disease] || [Ginkgo biloba | Alzheimer‘s Disease]"
  // If the question is "What are the benefits of fish oil?"
  // Your response could be:
  // "Fish oil is known for its rich content of Omega-3 fatty acids... The benefits of Fish Oil: Fish oil can delay or reduce the risk of cognitive decline.
  // Fight Inflammation: Omega-3 has potent... || [Fish Oil | Omega-3 fatty acids | cognitive decline | Inflammation] || [Fish Oil]"
  // If the question is "Can Coenzyme Q10 prevent Heart disease?"
  // Your response could be:
  // "Some studies have suggested that Coenzyme Q10 supplementation may have potential benefits for heart health... CoQ10 has antioxidant properties... ||
  // [Coenzyme Q10 | heart health || antioxidant] || [Coenzyme Q10 | Heart disease]
  //   `
  const num_triples = 3
  const num_entities = 4

  // const qaPrompt = `
  // You are an expert in healthcare domain and need to help user to answer the healthcare related questions.
  // Please return your response in three parts:
  // the 1st part is your response;
  // the 2nd part is triples ([entity, relation, entity]) summaring the facts in your 1st part response, in the format of json string list;
  // the 3rd part is the identified entities in user question, in the format of json string list.
  // Please use " || " to split the three parts.

  // The entities can only be the following types: Dietary Supplement, Drugs, Disease, Symptom, Gene.
  // Use no more than ${num_triples} triples  and no more than ${num_entities} entities.
  // The triples must use extractly the same entity and relation names as used in the response.
  // Each sentence in the response can be about only one triple.

  // For example, if the question is "Can Ginkgo biloba prevent Alzheimer's Disease?"
  // Your response could be:
  // "Gingko biloba is extracted from a plant...
  // Some studies have suggested that Gingko biloba may improve cognitive function and behavior in people with Alzheimer's disease... ||
  // [[Ginkgo biloba, improve, Alzheimer‘s Disease], [Ginkgo biloba, extract from, plant]] ||
  // [Ginkgo biloba, Alzheimer‘s Disease]"
  // If the question is "What are the benefits of fish oil?"
  // Your response could be:
  // "Fish oil is known for containing a rich content of Omega-3 fatty acids... Omega-3 fatty acids can delay or reduce the risk of cognitive decline.
  // [ [Fish Oil, contain, Omega-3 fatty acids], [Omega-3 fatty acids, delay, cognitive decline]] ||
  // || [Fish Oil]"
  //   `

  const qaPrompt = `
  You are an expert in healthcare and dietary supplements and need to help user to answer related questions.
  Please return your response, about 4 sentences, in a format where all entities and their relations are clearly defined in the response.
  Specifically, use [] to identify all entities and relations in the response,
  add () after identified entities and relations to assign unique ids to entities ($N1, $N2, ..) and relations ($R1, $R2, ...).
  For the relation, also add the entities it connects to. Use ; to separate if this relation exist in more than one triples.

  The entities can only be the following types: Dietary Supplement, Drugs, Disease, Symptom, Gene.
  Identified entities must have relations with other entities in the response.
  Each sentence in the response should not include more than one relation.
  Try to provide context in your response.

  After your response, also add the identified entities in user question, in the format of json string list;
  Please use " || " to split the two parts.

  Example 1,
  Question: What are the benefits of fish oil?
  Answer:  [Fish oil]($N1) is known for [containing]($R1, $N1, $N2) a rich content of [Omega-3 fatty acids]($N2)... [Omega-3 fatty acids]($N2) can [delay]($R2, $N2, $N3) or reduce the risk of [cognitive decline]($N3) || ['fish oil'].

  Example 2,
  Question: which supplements may prevent Alzheimer's Disease?
  [Gingko biloba]($N1) and [Vitamin E]($N2) may [improve]($R1, $N1, $N3; $R1, $N2, $N3) [Alzheimer's disease]($N3). [Gingko]($N1) is a ... || ['Alzheimer's Disease']. `

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
    temperature: 0, // 0-2, lower is more deterministic
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const fullResponse = completion
      // console.log('Full completion:', fullResponse) // Ensure this logs the expected completion

      const parts = fullResponse.split(' || ')
      const firstPart = parts[0]
      // const secondPart = parts[1] || ''
      // const thirdPart = parts[2] || ''

      // Debugging the parts
      // console.log('First Part:', firstPart)
      // console.log('Second Part:', secondPart)
      // console.log('Third Part:', thirdPart)

      // Adjusting the regex pattern to be more flexible
      // const keywordsListAnswer =  secondPart.match(/\[(.*?)\]/)?.[1].split(' | ') || []
      // const keywordsListQuestion = thirdPart.match(/\[(.*?)\]/)?.[1].split(' | ') || []

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
        ]
        // keywordsListAnswer,
        // keywordsListQuestion
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
