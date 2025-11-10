import { useCallback, useEffect, useRef, useState } from 'react'
import { debug } from '../lib/debug'
import { loadOfflineData, saveOfflineData } from '../lib/offlineStore'

export default function useAutosave<T>(
  data: T,
  endpoint: string,
  delay = 1500,
  maxRetries = 3
) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const timeout = useRef<NodeJS.Timeout | null>(null)
  const latestData = useRef(data)

  const saveAttempt = useCallback(
    async (attempt = 1): Promise<boolean> => {
      try {
        debug.trace('Autosave: attempting save', { endpoint, attempt })
        setSaving(true)
        setError(null)

        const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine

        if (!isOnline) {
          debug.warn('Autosave: offline, saving to IndexedDB fallback')
          await saveOfflineData('pending', latestData.current)
          return true
        }

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latestData.current)
        })

        debug.trace('Autosave: response received', {
          ok: res.ok,
          status: res.status
        })

        if (!res.ok) {
          const statusText = res.statusText || `HTTP ${res.status}`
          throw new Error(`Save failed: ${statusText}`)
        }

        setLastSavedAt(Date.now())
        setRetryCount(0)

        await saveOfflineData('pending', null)
        debug.info('Autosave: save succeeded')
        return true
      } catch (err) {
        const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine
        const message = err instanceof Error ? err.message : 'Save failed'

        debug.error('Autosave: save failed', { message })

        if (attempt < maxRetries && isOnline) {
          const delayMs = Math.pow(2, attempt) * 500
          setRetryCount(attempt)
          setError(message)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          return await saveAttempt(attempt + 1)
        }

        setRetryCount(0)
        setError(message)
        return false
      } finally {
        setSaving(false)
      }
    },
    [endpoint, maxRetries]
  )

  useEffect(() => {
    latestData.current = data

    if (timeout.current) {
      clearTimeout(timeout.current)
    }

    debug.trace('Autosave: state change detected', {
      endpoint,
      delay,
      timestamp: new Date().toISOString()
    })

    timeout.current = setTimeout(() => {
      void saveAttempt()
    }, delay)

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
        timeout.current = null
      }
    }
  }, [data, delay, saveAttempt])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const onReconnect = () => {
      void (async () => {
        const cached = await loadOfflineData<T>('pending')
        if (cached) {
          latestData.current = cached
          await saveAttempt()
        }
      })()
    }

    window.addEventListener('online', onReconnect)

    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine
    if (isOnline) {
      onReconnect()
    }

    return () => {
      window.removeEventListener('online', onReconnect)
    }
  }, [saveAttempt])

  return { saving, error, lastSavedAt, retryCount }
}
