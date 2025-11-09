'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'

import { BUCKETS } from '@/lib/buckets'
import type { BucketId } from '@/types/canvas'

const VALID_BUCKETS = BUCKETS.filter((bucket) => bucket.id !== 'do-now')

export function AddIntentionModal({
  isOpen,
  onClose,
  onAdd
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (title: string, description: string, bucket: BucketId) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bucket, setBucket] = useState<BucketId>(VALID_BUCKETS[0].id)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    if (bucket === 'do-now') {
      toast.error('Intentions can’t be placed in Do Now')
      return
    }
    onAdd(title.trim(), description.trim(), bucket)
    toast.success('Intention created')
    setTitle('')
    setDescription('')
    setBucket(VALID_BUCKETS[0].id)
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
            className="w-full border border-kings-grey-light rounded-md p-2 text-sm text-kings-black placeholder-kings-grey-dark bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-kings-red"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            className="w-full border border-kings-grey-light rounded-md p-2 text-sm text-kings-black placeholder-kings-grey-dark bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-kings-red"
            rows={3}
          />
          <select
            value={bucket}
            onChange={(event) => setBucket(event.target.value as BucketId)}
            className="w-full border border-kings-grey-light rounded-md p-2 text-sm text-kings-black bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-kings-red"
          >
            {VALID_BUCKETS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-kings-grey-dark px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border border-kings-red text-kings-red px-4 py-2 text-sm rounded-md hover:bg-kings-red hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
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
