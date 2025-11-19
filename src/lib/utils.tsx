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

export const highLevelNodes = ['physiology', 'supplement']

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    if (json?.error) {
      const error = new Error(json.error) as Error & { status: number }
      error.status = res.status
      throw error
    } else {
      throw new Error(`An unexpected error occurred (${res.status} ${res.statusText})`)
    }
  }

  return res.json()
}

/** Canonical category → color */
export const categoryColorMapping: Record<string, string> = {
  'Dietary Supplement': '#91b9f4', // Blue
  Disorders: '#f28e2c',            // Orange
  Drug: '#e15759',                 // Red
  'Genes & Molecular Sequences': '#76b7b2', // Cyan
  Anatomy: '#59a14f',              // Green
  'Living Beings': '#edc949',      // Yellow
  Physiology: '#af7aa1',           // Purple
  'Chemicals & Drugs': '#ff9da7',  // Pink
  Procedures: '#9c755f',           // Brown
  'Activities & Behaviors': '#bab0ab', // Gray
  'Concepts & Ideas': '#4e79a7',   // Blue
  Device: '#f28e2c',               // Orange
  Object: '#e15759',               // Red
  Objects: '#dddddd',              // Gray (fallback bucket)
  Organization: '#76b7b2',         // Cyan
  Phenomenon: '#59a14f',           // Green
  'Complementary and Integrative Health': '#ff0000', // Red
  NotFind: '#dddddd'               // Gray (not found)
}

/** Common label variants → canonical category */
const categoryAliases: Record<string, string> = {
  // unify common variants so the backend/LLM can be sloppy and you’re still fine
  'disease': 'Disorders',
  'disorders': 'Disorders',
  'drug': 'Drug',
  'drugs': 'Drug',
  'dietary supplement': 'Dietary Supplement',
  'supplement': 'Dietary Supplement',
  'gene': 'Genes & Molecular Sequences',
  'genes': 'Genes & Molecular Sequences',
  'celltype': 'Anatomy',
  'cell type': 'Anatomy',
  'process': 'Physiology',
  'riskfactor': 'Concepts & Ideas',
  'risk factor': 'Concepts & Ideas',
  'physiology': 'Physiology',
  'notfind': 'NotFind',
  'symptom': 'Physiology',      // map GPT "Symptom" to "Physiology" color (purple)
  'objects': 'Objects',         // plural → existing "Objects"
  'object': 'Object'            // singular → existing "Object"
}

/** Heuristic fallback if the LLM omitted the category — guesses from the name */
function guessCategoryByName(name?: string): string | undefined {
  if (!name) return undefined
  const n = name.toLowerCase()

  // Supplements
  if (/(^|\s)vitamin\b|omega-?3|fish oil|coenzyme|ginkgo|curcumin|resveratrol/.test(n))
    return 'Dietary Supplement'

  // Diseases
  if (/\balzheimer|parkinson|diabetes|cancer|disease\b/.test(n))
    return 'Disorders'

  // Genes
  if (/\b(apoe|apo e|ε4|e4|tp53|app|psen1|psen2)\b/.test(n))
    return 'Genes & Molecular Sequences'

  // Anatomy / cell types
  if (/\bneurons?\b|microglia|astrocyt|hippocamp|cortex|synapse|brain\b/.test(n))
    return 'Anatomy'

  // Physiological processes
  if (/\binflammation\b|oxidative stress|synaptic|cognitive|plasticity|stress\b/.test(n))
    return 'Physiology'

  // Risk / concepts
  if (/\bage\b|lifestyle|cardiovascular|hypertension|injury|traumatic|risk\b/.test(n))
    return 'Concepts & Ideas'

  return undefined
}

/** Deterministic non-gray fallback colors (no flicker, stable per name) */
const RESERVED_GRAYS = new Set(['#e5e7eb', '#dddddd'])
const FALLBACK_COLORS: string[] = Array.from(new Set(Object.values(categoryColorMapping)))
  .filter(c => !RESERVED_GRAYS.has(c))

function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i) // djb2
    h |= 0
  }
  return h >>> 0
}

export function deterministicColorFromName(name?: string): string {
  const basis = (name && name.trim()) || 'unknown'
  if (FALLBACK_COLORS.length === 0) return '#e5e7eb'
  const idx = hashString(basis) % FALLBACK_COLORS.length
  return FALLBACK_COLORS[idx]
}

/**
 * Returns a color for a category.
 * - If category maps to a non-gray canonical color → use it.
 * - Else → use a deterministic color from the palette based on the node name.
 */
export function colorForCategory(cat?: string, nameHint?: string) {
  let normalizedCat: string | undefined

  if (cat && cat.trim()) {
    const key = cat.trim().toLowerCase()
    normalizedCat =
      categoryAliases[key] ??
      Object.keys(categoryColorMapping).find(k => k.toLowerCase() === key) ??
      cat
  }

  if (normalizedCat) {
    const canonical = categoryColorMapping[normalizedCat]
    if (canonical && !RESERVED_GRAYS.has(canonical)) {
      return canonical
    }
  }

  // Deterministic non-gray fallback by name (avoids flicker and keeps nodes stable)
  return deterministicColorFromName(nameHint || normalizedCat)
}

/** Optionally normalize and persist a canonical category on nodes */
export function normalizeCategory(name: string, cat?: string): string {
  const key = (cat ?? '').trim().toLowerCase()
  const fromAlias =
    (key &&
      (categoryAliases[key] ??
        Object.keys(categoryColorMapping).find(k => k.toLowerCase() === key))) as
      | string
      | undefined

  return fromAlias ?? guessCategoryByName(name) ?? (cat || 'Objects')
}

/** Default API base for the Flask server */
export const API_BASE_DEFAULT =
  (import.meta as any)?.env?.VITE_API_BASE ?? 'http://localhost:5000'

/**
 * POST to /api/data on the Flask backend.
 * @param payload - body for the request
 * @param base - optional API base (overrides VITE_API_BASE). If omitted, uses API_BASE_DEFAULT.
 */
export async function fetchBackendData(payload: any, base?: string) {
  const API_BASE = (base && base.trim()) || API_BASE_DEFAULT

  try {
    const response = await fetch(`${API_BASE}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const txt = await response.text().catch(() => '')
      throw new Error(`HTTP ${response.status} ${response.statusText} :: ${txt}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[fetchBackendData] Failed to fetch data from backend:', error)
    return null
  }
}
