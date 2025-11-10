export async function saveOfflineData(key: string, data: any) {
  try {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return
    const db = await openDB()
    const tx = db.transaction('canvas', 'readwrite')
    tx.objectStore('canvas').put(data, key)
    await transactionDone(tx)
  } catch (err) {
    console.error('Offline save failed:', err)
  }
}

export async function loadOfflineData<T = unknown>(key: string): Promise<T | null> {
  try {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return null
    const db = await openDB()
    const tx = db.transaction('canvas', 'readonly')
    return await requestAsPromise<T | null>(tx.objectStore('canvas').get(key))
  } catch {
    return null
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'))
      return
    }

    const request = window.indexedDB.open('kings_canvas', 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('canvas')) {
        db.createObjectStore('canvas')
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function requestAsPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
