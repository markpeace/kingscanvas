'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

import { BUCKETS } from '@/lib/buckets'

export function AddIntentionModal({
  isOpen,
  onClose,
  onAdd
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (title: string, description: string, bucket: string) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bucket, setBucket] = useState(BUCKETS[0].id)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return

    onAdd(title.trim(), description.trim(), bucket)
    setTitle('')
    setDescription('')
    setBucket(BUCKETS[0].id)
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-kings-red rounded-lg shadow-xl p-6 w-[400px] text-kings-black">
        <h2 className="text-lg font-semibold text-kings-red mb-4">Add New Intention</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Intention title"
            className="w-full border border-kings-grey-light rounded-md p-2 text-sm text-kings-black placeholder-kings-grey-dark bg-white"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            className="w-full border border-kings-grey-light rounded-md p-2 text-sm text-kings-black placeholder-kings-grey-dark bg-white"
            rows={3}
          />
          <select
            value={bucket}
            onChange={(event) => setBucket(event.target.value)}
            className="w-full border border-kings-grey-light rounded-md p-2 text-sm text-kings-black bg-white"
          >
            {BUCKETS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
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
              className="border border-kings-red text-kings-red px-4 py-2 text-sm rounded-md hover:bg-kings-red hover:text-white transition-colors"
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
