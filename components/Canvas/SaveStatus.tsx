import React from 'react'

interface SaveStatusProps {
  saving: boolean
  error: string | null
  retryCount: number
}

export default function SaveStatus({ saving, error, retryCount }: SaveStatusProps) {
  let message = 'Saved'

  if (saving) {
    message = 'Saving…'
  } else if (error) {
    message = retryCount > 0 ? `Retrying (${retryCount})…` : 'Error saving'
  }

  const color = retryCount > 0
    ? 'text-amber-500'
    : error
      ? 'text-red-600'
      : saving
        ? 'text-gray-500 animate-pulse'
        : 'text-gray-400'

  return (
    <div className={`fixed bottom-4 right-6 text-xs font-medium ${color}`}>
      {message}
    </div>
  )
}
