import { useEffect, useRef, useState } from 'react'

export default function useAutosave<T>(data: T, endpoint: string, delay = 1500) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const timeout = useRef<NodeJS.Timeout | null>(null)
  const latestData = useRef(data)

  useEffect(() => {
    latestData.current = data

    if (timeout.current) {
      clearTimeout(timeout.current)
    }

    timeout.current = setTimeout(async () => {
      try {
        setSaving(true)
        setError(null)

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latestData.current)
        })

        if (!res.ok) {
          throw new Error('Save failed')
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Save failed')
      } finally {
        setSaving(false)
      }
    }, delay)

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    }
  }, [data, endpoint, delay])

  return { saving, error }
}
