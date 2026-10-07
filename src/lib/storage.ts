import { useSyncExternalStore } from 'react'

type Listener = () => void

export interface PersistentStore<T> {
  key: string
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (listener: Listener) => () => void
  use: () => T
}

/**
 * A tiny localStorage-backed store. Reads/writes are wrapped in try/catch so the
 * app keeps working in private mode or when storage is blocked. Updates are
 * broadcast to every subscribed component and synced across tabs.
 */
export function createPersistentStore<T>(
  key: string,
  initial: T,
  validate?: (value: unknown) => boolean,
): PersistentStore<T> {
  const listeners = new Set<Listener>()

  const read = (): T => {
    try {
      const raw = localStorage.getItem(key)
      if (raw == null) return initial
      const parsed: unknown = JSON.parse(raw)
      if (validate && !validate(parsed)) return initial
      return parsed as T
    } catch {
      return initial
    }
  }

  let value: T = typeof window === 'undefined' ? initial : read()

  const emit = () => listeners.forEach((l) => l())

  const store: PersistentStore<T> = {
    key,
    get: () => value,
    set: (next) => {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        /* storage unavailable — keep in-memory value */
      }
      emit()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    use: () => useSyncExternalStore(store.subscribe, store.get, store.get),
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === key) {
        value = read()
        emit()
      }
    })
  }

  return store
}

const isStringArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isObject = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v)

/* ---------- App stores ---------- */

export interface RecentEntry {
  key: string // "<category>/<topic>"
  at: number
}

/** DSA sheet progress: problem id → completion timestamp */
export const sheetProgressStore = createPersistentStore<Record<string, number>>('rr:sheet:done', {}, isObject)

/** Which sheet sections are expanded */
export const sheetOpenStore = createPersistentStore<string[] | null>('rr:sheet:open', null, (v) => v === null || isStringArray(v))

/** Bookmarked note topics ("python/lists") */
export const bookmarksStore = createPersistentStore<string[]>('rr:bookmarks', [], isStringArray)

/** Recently viewed note topics, newest first */
export const recentStore = createPersistentStore<RecentEntry[]>('rr:recent', [], (v) =>
  Array.isArray(v) && v.every((x) => isObject(x) && typeof (x as RecentEntry).key === 'string'),
)

export function pushRecent(key: string) {
  recentStore.set((prev) => [{ key, at: Date.now() }, ...prev.filter((r) => r.key !== key)].slice(0, 10))
}

export function toggleBookmark(key: string): boolean {
  let added = false
  bookmarksStore.set((prev) => {
    if (prev.includes(key)) return prev.filter((k) => k !== key)
    added = true
    return [key, ...prev]
  })
  return added
}
