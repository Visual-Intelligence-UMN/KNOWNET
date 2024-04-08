'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  DeleteCommand,
  PutCommand
} from '@aws-sdk/lib-dynamodb'
import { auth } from '@/auth'
import { type Chat } from '@/lib/types'

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
  }
})
const docClient = DynamoDBDocumentClient.from(dynamoDBClient)

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const params = {
      TableName: 'Chats',
      IndexName: 'userIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }

    const result = await docClient.send(new QueryCommand(params))
    return result.Items as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const params = {
    TableName: 'Chats',
    Key: {
      id
    }
  }

  const result = await docClient.send(new GetCommand(params))
  const chat = result.Item as Chat

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const params = {
    TableName: 'Chats',
    Key: {
      id
    }
  }

  await docClient.send(new DeleteCommand(params))

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const params = {
    TableName: 'Chats',
    IndexName: 'userIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': session.user.id
    }
  }

  const result = await docClient.send(new QueryCommand(params))

  for (const chat of result.Items as Chat[]) {
    const deleteParams = {
      TableName: 'Chats',
      Key: {
        id: chat.id
      }
    }
    await docClient.send(new DeleteCommand(deleteParams))
  }

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const params = {
    TableName: 'Chats',
    Key: {
      id
    }
  }

  const result = await docClient.send(new GetCommand(params))
  const chat = result.Item as Chat

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(chat: Chat) {
  const session = await auth()

  if (!session?.user?.id || session.user.id !== chat.userId) {
    return {
      error: 'Unauthorized'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  const params = {
    TableName: 'Chats',
    Item: payload
  }

  await docClient.send(new PutCommand(params))

  return payload
}
