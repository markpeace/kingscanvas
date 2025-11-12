import { useEffect, useRef, useState } from 'react'

import { debug } from '@/lib/debug'

export default function useAutosave<T>(
  data: T,
  endpoint: string,
  delay = 1500,
  maxRetries = 3
) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const timeout = useRef<NodeJS.Timeout | null>(null)
  const latestData = useRef<T>(data)

  async function attemptSave(attempt = 1): Promise<boolean> {
    try {
      setSaving(true)
      setError(null)

      debug.trace('Autosave: attempting save', {
        attempt,
        endpoint,
        size: JSON.stringify(latestData.current)?.length || 0
      })

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(latestData.current)
      })

      debug.trace('Autosave: response received', {
        ok: res.ok,
        status: res.status
      })

      if (!res.ok) throw new Error(`Save failed: ${res.statusText}`)

      setLastSavedAt(Date.now())
      setRetryCount(0)
      debug.info('Autosave: save succeeded')
      return true
    } catch (err: any) {
      debug.error('Autosave: save failed', { message: err?.message || 'Unknown' })

      if (attempt < maxRetries) {
        const backoff = Math.pow(2, attempt) * 500
        setRetryCount(attempt)
        debug.warn('Autosave: scheduling retry', { attempt: attempt + 1, backoff })
        await new Promise((r) => setTimeout(r, backoff))
        return attemptSave(attempt + 1)
      }

      setError(err?.message || 'Save failed')
      return false
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    latestData.current = data
    if (timeout.current) clearTimeout(timeout.current)

    debug.trace('Autosave: change detected; debouncing', { delay })

    timeout.current = setTimeout(() => {
      attemptSave()
    }, delay)

    return () => {
      if (timeout.current) clearTimeout(timeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, endpoint, delay])

  return { saving, error, lastSavedAt, retryCount }
}
