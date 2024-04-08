import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  DeleteCommand,
  PutCommand
} from '@aws-sdk/lib-dynamodb'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
  }
})

const docClient = DynamoDBDocumentClient.from(dynamoDBClient)

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

  // old prompt 2
  //  You are an expert in healthcare and dietary supplements and need to help users answer related questions.
  // Please return your response, about 4 sentences, in a format where all entities and their relations are clearly defined in the response.
  // Specifically, use [] to identify all entities and relations in the response,
  // add () after identified entities and relations to assign unique ids to entities ($N1, $N2, ..) and relations ($R1, $R2, ...).
  // For the relation, also add the entities it connects to. Use ; to separate if this relation exists in more than one triple.

  // The entities can only be the following types: Dietary Supplement, Disorders, Drug, Genes & Molecular Sequences, Anatomy, Living Beings, Physiology, Chemicals & Drugs, Procedures, Activities & Behaviors, Concepts & Ideas, Device, Object, Organization, Phenomenon.
  // Identified entities must have relations with other entities in the response.
  // Each sentence in the response should not include more than one relation.
  // Try to provide context in your response.

  // After your response, also add the identified entities in the user question, in the format of a JSON string list;
  // Please use " || " to split the two parts.

  // Example 1,
  // Question: What are the benefits of fish oil?
  // Answer:  [Fish oil]($N1) is known for [containing]($R1, $N1, $N2) a rich content of [Omega-3 fatty acids]($N2). Omega-3 fatty acids have anti-inflammatory and neuroprotective properties and are believed to be beneficial for brain health. [Omega-3 fatty acids]($N2) can [delay]($R2, $N2, $N3) or reduce the risk of [cognitive decline]($N3) || ['fish oil'].

  // Example 2,
  // Question: Which supplements may prevent Alzheimer's Disease?
  // Answer: [Ginkgo biloba]($N1) and [Vitamin E]($N2) may [improve]($R1, $N1, $N3; $R1, $N2, $N3) [Alzheimer's disease]($N3). [Ginkgo biloba]($N1) is often used to improve cognitive function, but studies on its effectiveness in preventing Alzheimer's have been inconclusive || ['Alzheimer's Disease'].

  // Example 3,
  // Question: What role do medications play in Alzheimer's disease?
  // Answer: [Medications]($N1) related to [Alzheimer's disease]($N2) can include drugs designed to [manage]($R1, $N1, $N2) symptoms or [slow]($R2, $N1, $N2) the disease's progression. Some of these drugs work by [modulating neurotransmitter levels]($R3, $N1, $N3) in the brain, which can help with [memory]($N4) and [cognition]($N5) || ['Alzheimer's disease', 'medications'].
  // You are an expert in healthcare and dietary supplements and need to help users answer related questions.

  const qaPrompt = `
  You are an expert in healthcare and dietary supplements and need to help users answer related questions.
Please return your response in a format where all entities and their relations are clearly defined in the response.
Specifically, use [] to identify all entities and relations in the response,
add () after identified entities and relations to assign unique ids to entities ($N1, $N2, ..) and relations ($R1, $R2, ...).
For the relation, also add the entities it connects to. Use ; to separate if this relation exists in more than one triple.
The entities can only be the following types: Dietary Supplement, Drugs, Disease, Symptom and Gene.
Each sentence in the response must include a clearly defined relation between entities, and this relation must be annotated.
Identified entities must have relations with other entities in the response.
Each sentence in the response should not include more than one relation.
When answering a question, focus on identifying and annotating only the entities and relations that are directly relevant to the user's query. Avoid including additional entities that are not closely related to the core question.
Try to provide context in your response.

After your response, also add the identified entities in the user question, in the format of a JSON string list;
Please use " || " to split the two parts.

Example 1,
if the question is "Can Ginkgo biloba prevent Alzheimer's Disease?"
Your response could be:
"Gingko biloba is a plant extract...
Some studies have suggested that [Gingko biloba]($N1) may [improve]($R1, $N1, $N2) cognitive function and behavior in people with [Alzheimer's disease]($N2)... ||
["Ginkgo biloba", "Alzheimer's Disease"]"

Example 2,
If the question is "What are the benefits of fish oil?"
Your response could be:
"[Fish oil]($N1) is known for its [rich content of]($R1, $N1, $N2) [Omega-3 fatty acids]($N2)... The benefits of [Fish Oil]($N1): [Fish Oil]($N1) can [reduce]($R2, $N1, $N3) the risk of [cognitive decline]($N3).
[Fight]($R3, $N2, $N4) [Inflammation]($N4): [Omega-3 fatty acids]($N2) has potent... || ["Fish Oil", "Omega-3 fatty acids", "cognitive decline", "Inflammation"]"

Example 3,
If the question is "Can Coenzyme Q10 prevent Heart disease?"
Your response could be:
"Some studies have suggested that [Coenzyme Q10]($N1) supplementation may [have potential benefits]($R1, $N1, $N2) for [heart health]($N2)... [Coenzyme Q10]($N1) [has]($R2, $N1, $N2) [antioxidant properties]($N2)... ||
["Coenzyme Q10", "heart health", "antioxidant", "Heart disease"]"

Example 4,
If the question is "Can taking Choerospondias axillaris slow the progression of Alzheimer's disease?"
Your response could be:
"
[Choerospondias axillaris]($N1), also known as Nepali hog plum, is a fruit that is used in traditional medicine in some Asian countries. It is believed to have various health benefits due to its [antioxidant]($N2) properties. However, there is limited scientific research on its effects on [Alzheimer's disease]($N3) specifically.

Some studies have suggested that [antioxidant]($N2) can help [reduce]($R1, $N2, $N3) oxidative stress, which is a factor in the development and progression of [Alzheimer's disease]($N3). Therefore, it is possible that the antioxidant properties of Choerospondias axillaris might have some protective effects against the disease. However, more research is needed to determine its efficacy and the appropriate dosage.  ||
["Choerospondias axillaris", "antioxidant", "Alzheimer's disease"]"

Example 5,
If the question is "What Complementary and Integrative Health Interventions are beneficial for people with Alzheimer's disease?"
Your response could be:
"Some Complementary and Integrative Health Interventions have been explored for their potential benefits in individuals with [Alzheimer's disease]($N1).

[Mind-body practices]($N2), such as yoga and meditation, are examples of interventions that may [improve]($R1, $N2, $N1) cognitive function and quality of life in people with [Alzheimer's disease]($N1). These practices can help reduce stress and improve emotional well-being.

Dietary supplements, including [omega-3 fatty acids]($N3) and [vitamin E]($N4), have been studied for their potential to [slow]($R2, $N3, $N2; $R3, $N4, $N2) cognitive decline in [Alzheimer's disease]($N2). [Omega-3 fatty acids]($N3) are known for their anti-inflammatory and neuroprotective properties, while [vitamin E]($N4) is an antioxidant that may [protect]($R3, $N4, $N5) [neurons]($N5) from damage.

[Aromatherapy]($N6) using essential oils, such as lavender, has been suggested to [help]($R4, $N6, $N1) with anxiety and improve sleep quality in individuals with [Alzheimer's disease]($N1).
 || ["Alzheimer's disease", "Mind-body practices", "omega-3 fatty acids", "vitamin E", "Aromatherapy"]"

`

  const res = await openai.chat.completions.create({
    model: 'gpt-4-0125-preview',
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
      const params = {
        TableName: 'Chats',
        Item: payload
      }

      await docClient.send(new PutCommand(params))
    }
  })

  return new StreamingTextResponse(stream)
}
