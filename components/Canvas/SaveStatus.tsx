import { useEffect, useState } from 'react'

type Props = {
  saving: boolean
  error: string | null
  lastSavedAt: number | null
  retryCount: number
}

const RECENT_DURATION = 4000

export default function SaveStatus({ saving, error, lastSavedAt, retryCount }: Props) {
  const [recentlySaved, setRecentlySaved] = useState(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null

    if (!saving && !error && lastSavedAt) {
      setRecentlySaved(true)
      timeout = setTimeout(() => setRecentlySaved(false), RECENT_DURATION)
    }

    if (saving) {
      setRecentlySaved(false)
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [saving, error, lastSavedAt])

  if (!saving && !error && !lastSavedAt) {
    return null
  }

  let label: string | null = null
  let toneClasses = 'border-gray-200 bg-white/90 text-gray-500'
  let showSpinner = false

  if (saving) {
    label = retryCount > 0 ? `Saving… (retry ${retryCount})` : 'Saving…'
    toneClasses = 'border-kings-red/40 bg-white text-kings-red'
    showSpinner = true
  } else if (error) {
    label = 'Error saving'
    toneClasses = 'border-red-300 bg-red-50 text-red-700'
  } else if (recentlySaved) {
    label = 'Saved a few seconds ago'
  } else {
    label = 'Saved'
  }

  if (!label) {
    return null
  }

  return (
    <div
      aria-live="polite"
      className={`fixed top-6 right-6 z-40 flex select-none items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${toneClasses}`}
    >
      {showSpinner ? (
        <span
          aria-hidden="true"
          className="inline-flex h-3 w-3 animate-spin rounded-full border-[2px] border-current border-r-transparent"
        />
      ) : null}
      <span>{label}</span>
    </div>
  )
}
