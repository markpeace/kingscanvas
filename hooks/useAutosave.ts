import { useCallback, useEffect, useRef, useState } from 'react'

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
  const queuedListener = useRef<(() => void) | null>(null)

  const saveAttempt = useCallback(
    async (attempt = 0): Promise<boolean> => {
      try {
        setSaving(true)
        setError(null)

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latestData.current)
        })

        if (!res.ok) {
          const statusText = res.statusText || `HTTP ${res.status}`
          throw new Error(`Save failed: ${statusText}`)
        }

        setLastSavedAt(Date.now())
        setRetryCount(0)
        return true
      } catch (err) {
        console.error('Autosave error:', err)

        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
        const message = err instanceof Error ? err.message : 'Save failed'

        if (attempt < maxRetries && isOnline) {
          const delayMs = Math.pow(2, attempt) * 500
          setRetryCount(attempt + 1)
          setError(message)
          setSaving(false)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          return await saveAttempt(attempt + 1)
        }

        if (!isOnline && typeof window !== 'undefined') {
          console.warn('Offline — save queued until reconnect')

          if (queuedListener.current) {
            window.removeEventListener('online', queuedListener.current)
          }

          const handleOnline = () => {
            queuedListener.current = null
            void saveAttempt()
          }

          queuedListener.current = handleOnline
          window.addEventListener('online', handleOnline, { once: true })
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

    const scheduleSave = () => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

      if (isOnline) {
        void saveAttempt()
        return
      }

      console.warn('Offline — save queued until reconnect')
      if (queuedListener.current && typeof window !== 'undefined') {
        window.removeEventListener('online', queuedListener.current)
      }

      const handleOnline = () => {
        queuedListener.current = null
        void saveAttempt()
      }

      queuedListener.current = handleOnline
      if (typeof window !== 'undefined') {
        window.addEventListener('online', handleOnline, { once: true })
      }
    }

    timeout.current = setTimeout(scheduleSave, delay)

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
        timeout.current = null
      }

      if (queuedListener.current && typeof window !== 'undefined') {
        window.removeEventListener('online', queuedListener.current)
        queuedListener.current = null
      }
    }
  }, [data, delay, maxRetries, saveAttempt])

  return { saving, error, lastSavedAt, retryCount }
}
