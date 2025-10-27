'use client'
import * as React from 'react'

export type RecommendationItem = {
  head: string
  relation: string
  tail: string
  count: number
  papers?: string[]
  text: string // e.g., "show me more about Vitamin E –[protects]– Neurons (2 papers)"
}

export function RecommendationTray({
  items,
  onPick,
  onDismiss,
  maxVisible = 3
}: {
  items: RecommendationItem[]
  onPick: (item: RecommendationItem) => void
  onDismiss?: (item: RecommendationItem) => void
  maxVisible?: number
}) {
  const [expanded, setExpanded] = React.useState(false)
  const visible = expanded ? items : items.slice(0, maxVisible)

  if (!items?.length) return null

  return (
    <div className="mt-3 mb-2 rounded-xl border bg-white/70 p-2 backdrop-blur md:p-3 dark:bg-zinc-900/60">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Recommendations
        </div>
        {items.length > maxVisible && (
          <button
            className="text-xs underline text-zinc-600 dark:text-zinc-300"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? 'Show less' : `More (${items.length - maxVisible})`}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map((rec, i) => (
          <div
            key={`${rec.head}-${rec.relation}-${rec.tail}-${i}`}
            className="group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <button
              onClick={() => onPick(rec)}
              className="truncate"
              title={`${rec.head} —[${rec.relation}]→ ${rec.tail}`}
            >
              {rec.text}
            </button>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
              {rec.count}
            </span>
            {onDismiss && (
              <button
                onClick={() => onDismiss(rec)}
                className="ml-1 hidden rounded-full px-1 text-xs text-zinc-500 hover:bg-zinc-200 group-hover:inline dark:hover:bg-zinc-700"
                title="Dismiss"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
