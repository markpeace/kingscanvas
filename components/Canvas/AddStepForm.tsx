'use client'

import { FormEvent, useState } from 'react'

interface AddStepFormProps {
  onAdd: (title: string) => void
}

export function AddStepForm({ onAdd }: AddStepFormProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      return
    }

    onAdd(trimmedTitle)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add new step..."
        className="border border-kings-grey-light rounded-md p-2 text-sm flex-shrink w-full"
      />
      <button
        type="submit"
        className="bg-kings-red text-white px-3 py-2 text-sm rounded-md hover:bg-kings-red/90"
      >
        Add
      </button>
    </form>
  )
}
