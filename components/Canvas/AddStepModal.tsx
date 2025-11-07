'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function AddStepModal({
  isOpen,
  onClose,
  onAdd
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (title: string) => void
}) {
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim())
    setTitle('')
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
        <h2 className="text-lg font-semibold text-kings-red mb-4">Add Step</h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What step would you like to add?"
            className="w-full border border-kings-grey-light rounded-md p-2 text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-kings-grey-dark px-3 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-kings-red text-white px-4 py-2 text-sm rounded-md hover:bg-kings-red/90"
            >
              Add Step
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
