import { useSyncExternalStore } from 'react'

/** Minimal in-memory observable value shared across components. */
export function atom<T>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  const subscribe = (l: () => void) => {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }
  const get = () => value
  const set = (next: T | ((prev: T) => T)) => {
    const v = typeof next === 'function' ? (next as (p: T) => T)(value) : next
    if (Object.is(v, value)) return
    value = v
    listeners.forEach((l) => l())
  }
  const use = () => useSyncExternalStore(subscribe, get, get)
  return { get, set, subscribe, use }
}

/** Global UI state */
export const paletteOpen = atom(false)
export const mobileMenuOpen = atom(false)
/** False while the first-visit boot animation is covering the page. */
export const bootDone = atom(true)
