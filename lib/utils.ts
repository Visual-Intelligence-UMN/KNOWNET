import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export const categoryColorMapping: { [key: string]: string } = {
  'Dietary Supplement': '#91b9f4', // Blue
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


export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export async function fetchBackendData(payload: any) {
  try {
    const response = await fetch('http://localhost:5328/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch data from backend:', error)
    return null
  }
}
