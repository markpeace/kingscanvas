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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-kings-white rounded-xl shadow-2xl border border-kings-grey-light/60 p-6 w-[min(90vw,420px)]">
        <h2 className="text-xl font-semibold text-kings-red mb-4">Add Step</h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What step would you like to add?"
            className="w-full rounded-lg border border-kings-grey-light/80 bg-kings-white p-3 text-base font-medium text-kings-black placeholder:text-kings-grey-light/90 focus:outline-none focus:ring-2 focus:ring-kings-red/40 focus:border-kings-red/60 transition"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-kings-grey-dark px-3 py-2 text-sm hover:text-kings-red transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-kings-red text-white px-4 py-2 text-sm rounded-md shadow-sm hover:bg-kings-red/90 focus:outline-none focus:ring-2 focus:ring-kings-red/40 focus:ring-offset-1 focus:ring-offset-kings-white"
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
