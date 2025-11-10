import React from 'react'

interface SaveStatusProps {
  saving: boolean
  error: string | null
}

export default function SaveStatus({ saving, error }: SaveStatusProps) {
  const message = error ? 'Error saving' : saving ? 'Saving…' : 'Saved'

  const color = error
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
