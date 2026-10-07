import { useSyncExternalStore } from 'react'

export type ToastTone = 'default' | 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  description?: string
  tone: ToastTone
  action?: { label: string; onClick: () => void }
  duration: number
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(
  message: string,
  opts: { description?: string; tone?: ToastTone; action?: Toast['action']; duration?: number } = {},
) {
  const t: Toast = {
    id: nextId++,
    message,
    description: opts.description,
    tone: opts.tone ?? 'default',
    action: opts.action,
    duration: opts.duration ?? 2800,
  }
  toasts = [...toasts.slice(-2), t]
  emit()
  window.setTimeout(() => dismissToast(t.id), t.duration)
  return t.id
}

export function dismissToast(id: number) {
  const before = toasts.length
  toasts = toasts.filter((t) => t.id !== id)
  if (toasts.length !== before) emit()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts, () => toasts)
}
