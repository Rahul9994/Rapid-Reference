/** Deploy base path without a trailing slash ('' at the domain root, '/Rapid-Reference' on GitHub Pages). */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Absolute, shareable URL for an in-app path like "/faq?q=..." */
export function appUrl(path: string): string {
  return `${window.location.origin}${BASE_PATH}${path}`
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
}

/** Strip Markdown syntax to plain text (used for search + previews). */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[^\n]*\n([\s\S]*?)```/g, (_m, code: string) => ` ${code} `)
    .replace(/^>\s?\[![A-Z]+\]\s*/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\|?[\s:-]+\|[\s|:-]*$/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function readingTime(md: string): number {
  const words = md.split(/\s+/).length
  return Math.max(1, Math.round(words / 210))
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

/** Scroll to a heading id inside the notes article, expanding its section if collapsed. */
export function scrollToHeading(id: string, smooth = true) {
  const el = document.getElementById(id)
  if (!el) return false
  const section = el.closest('.doc-section')
  if (section?.classList.contains('collapsed')) {
    section.classList.remove('collapsed')
    section.querySelector('[data-toggle]')?.setAttribute('aria-expanded', 'true')
  }
  el.scrollIntoView({ behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto', block: 'start' })
  return true
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}
