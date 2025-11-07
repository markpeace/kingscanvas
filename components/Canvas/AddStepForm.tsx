'use client'

import { type FormEvent, useState } from 'react'

type AddStepFormProps = {
  onAdd: (title: string) => void
}

export function AddStepForm({ onAdd }: AddStepFormProps) {
  const [title, setTitle] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim())
    setTitle('')
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add new step..."
        className="flex-1 border border-kings-grey-light rounded-md p-2 text-sm"
      />
      <button
        type="submit"
        className="bg-kings-red text-white px-3 py-2 rounded-md text-sm hover:bg-kings-red/90"
      >
        Add
      </button>
    </form>
  )
}
