'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'

type AddStepModalProps = {
  isOpen: boolean
  onClose: () => void
  onAdd: (title: string) => void
}

export function AddStepModal({ isOpen, onClose, onAdd }: AddStepModalProps) {
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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
      return
    }

    inputRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim())
    toast.success('Step added')
    setTitle('')
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-step-title"
        className="w-full max-w-[520px] rounded-2xl border border-kings-grey-light/70 bg-kings-white p-6 shadow-2xl focus:outline-none"
      >
        <h2 id="add-step-title" className="text-xl font-semibold text-kings-red">
          Add Step
        </h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Describe a concrete next step you could take."
            ref={inputRef}
            className="w-full rounded-lg border border-kings-grey-light/80 bg-kings-white p-3 text-base font-medium text-kings-black placeholder:text-kings-grey-light/90 focus:outline-none focus-visible:border-kings-red focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white transition"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-kings-grey-dark transition hover:text-kings-red focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="inline-flex items-center rounded-md border border-kings-red px-4 py-2 text-sm font-medium text-kings-red transition focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white hover:bg-kings-red hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-kings-red"
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
