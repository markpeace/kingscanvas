import React from 'react'

type Props = {
  saving: boolean
  error: string | null
  lastSavedAt: number | null
  retryCount: number
}

function fmt(ts: number | null) {
  if (!ts) return ''
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function SaveStatus({ saving, error, lastSavedAt, retryCount }: Props) {
  let label = 'Saved'
  let classes = 'text-gray-600 border-gray-200 bg-white'

  if (saving) {
    label = retryCount > 0 ? `Saving… (retry ${retryCount})` : 'Saving…'
  } else if (error) {
    label = 'Error saving'
    classes = 'text-red-700 border-red-300 bg-red-50'
  }

  return (
    <div
      aria-live="polite"
      className={[
        'fixed bottom-4 right-6 z-40 rounded-md border px-3 py-1 text-xs shadow-sm select-none',
        classes
      ].join(' ')}
    >
      <span>{label}</span>
      {!saving && !error && lastSavedAt ? (
        <span className="ml-2 text-gray-400">at {fmt(lastSavedAt)}</span>
      ) : null}
    </div>
  )
}
