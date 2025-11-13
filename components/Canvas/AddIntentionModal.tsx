'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'

import { BUCKETS } from '@/lib/buckets'
import type { BucketId } from '@/types/canvas'

const VALID_BUCKETS = BUCKETS.filter((bucket) => bucket.id !== 'do-now')

type AddIntentionModalProps = {
  isOpen: boolean
  onClose: () => void
  onAdd: (title: string, description: string, bucket: BucketId) => void | Promise<void>
}

export function AddIntentionModal({ isOpen, onClose, onAdd }: AddIntentionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const DEFAULT_BUCKET: BucketId = 'after-graduation'
  const [bucket, setBucket] = useState<BucketId>(DEFAULT_BUCKET)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    if (bucket === 'do-now') {
      toast.error('Intentions can’t be placed in Do Now')
      return
    }
    void onAdd(title.trim(), description.trim(), bucket)
    toast.success('Intention created')
    setTitle('')
    setDescription('')
    setBucket(DEFAULT_BUCKET)
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setDescription('')
      setBucket(DEFAULT_BUCKET)
      return
    }

    titleInputRef.current?.focus()
  }, [DEFAULT_BUCKET, isOpen])

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

  if (!isOpen) return null

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
        aria-labelledby="add-intention-title"
        className="w-full max-w-[520px] rounded-2xl border border-kings-grey-light/70 bg-kings-white p-6 text-kings-black shadow-2xl"
      >
        <h2 id="add-intention-title" className="text-xl font-semibold text-kings-red">
          Add New Intention
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="intention-title" className="text-sm font-medium text-kings-grey-dark">
              Intention title
            </label>
            <input
              id="intention-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Name your intention"
              ref={titleInputRef}
              className="w-full rounded-lg border border-kings-grey-light/80 bg-kings-white p-3 text-base font-medium text-kings-black placeholder:text-kings-grey-light/90 focus:outline-none focus-visible:border-kings-red focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white"
            />
            <p className="text-xs text-kings-grey-dark/80">
              A big thing you hope to achieve while you are at King’s.
            </p>
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg border border-kings-grey-light/80 bg-kings-white p-3 text-base text-kings-black placeholder:text-kings-grey-light/90 focus:outline-none focus-visible:border-kings-red focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white"
            rows={3}
          />
          <select
            value={bucket}
            onChange={(event) => setBucket(event.target.value as BucketId)}
            className="w-full rounded-lg border border-kings-grey-light/80 bg-kings-white p-3 text-base text-kings-black focus:outline-none focus-visible:border-kings-red focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-kings-white"
          >
            {VALID_BUCKETS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
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
              Add Intention
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
