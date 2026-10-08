import { isThemeChoice, type ThemeChoice, type ThemeId } from '../data/themes'
import { createPersistentStore } from './storage'
import { prefersReducedMotion } from './utils'

export const themeStore = createPersistentStore<ThemeChoice>('rr:theme', 'system', isThemeChoice)

const lightQuery = () => window.matchMedia('(prefers-color-scheme: light)')

export function resolveTheme(choice: ThemeChoice): ThemeId {
  if (choice !== 'system') return choice
  return lightQuery().matches ? 'ivory' : 'noir'
}

function syncMetaThemeColor() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta && bg) meta.setAttribute('content', bg)
}

function applyResolved(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme)
  syncMetaThemeColor()
}

/**
 * Switch theme. When the View Transitions API is available the new theme is
 * revealed with a circular wipe that starts at `origin` (usually the click).
 */
export function setTheme(choice: ThemeChoice, origin?: { x: number; y: number }) {
  const next = resolveTheme(choice)
  const root = document.documentElement
  const commit = () => {
    applyResolved(next)
    themeStore.set(choice)
  }

  if (root.getAttribute('data-theme') === next) {
    themeStore.set(choice)
    return
  }

  if (prefersReducedMotion()) {
    commit()
    return
  }

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> }
  }

  if (origin && typeof doc.startViewTransition === 'function') {
    const transition = doc.startViewTransition(commit)
    transition.ready
      .then(() => {
        const radius = Math.hypot(
          Math.max(origin.x, window.innerWidth - origin.x),
          Math.max(origin.y, window.innerHeight - origin.y),
        )
        root.animate(
          {
            clipPath: [
              `circle(0px at ${origin.x}px ${origin.y}px)`,
              `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
            ],
          },
          { duration: 620, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
    return
  }

  root.classList.add('theme-transition')
  commit()
  window.setTimeout(() => root.classList.remove('theme-transition'), 450)
}

/** Keep the document in sync with the stored choice + OS preference. */
export function initTheme() {
  applyResolved(resolveTheme(themeStore.get()))
  lightQuery().addEventListener('change', () => {
    if (themeStore.get() === 'system') applyResolved(resolveTheme('system'))
  })
  themeStore.subscribe(() => {
    const resolved = resolveTheme(themeStore.get())
    if (document.documentElement.getAttribute('data-theme') !== resolved) applyResolved(resolved)
  })
}
