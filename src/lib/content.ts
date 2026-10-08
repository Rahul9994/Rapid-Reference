import type { CategoryId } from '../data/notes'
import type { TrackId } from '../data/labs'
import { faqCategories, type FaqCategoryId, type FaqItem } from '../data/faq'
import { slugify } from './utils'

type Bundle = Record<string, string>

// One lazily-loaded chunk per category keeps navigation inside a category instant.
const noteLoaders: Record<CategoryId, () => Promise<{ default: Bundle }>> = {
  python: () => import('../content/notes/python/index.ts'),
  dsa: () => import('../content/notes/dsa/index.ts'),
  os: () => import('../content/notes/os/index.ts'),
  dbms: () => import('../content/notes/dbms/index.ts'),
  cn: () => import('../content/notes/cn/index.ts'),
}

const bundleCache = new Map<CategoryId, Promise<Bundle>>()

export function loadNoteBundle(category: CategoryId): Promise<Bundle> {
  let p = bundleCache.get(category)
  if (!p) {
    p = noteLoaders[category]().then((m) => m.default)
    p.catch(() => bundleCache.delete(category))
    bundleCache.set(category, p)
  }
  return p
}

export async function loadNote(category: CategoryId, slug: string): Promise<string | undefined> {
  const bundle = await loadNoteBundle(category)
  return bundle[`./${slug}.md`]
}

export function prefetchNotes(category: CategoryId) {
  loadNoteBundle(category).catch(() => {})
}

// A.I / M.L notes: one chunk per track.
const labLoaders: Record<TrackId, () => Promise<{ default: Bundle }>> = {
  ai: () => import('../content/ai/index.ts'),
  ml: () => import('../content/ml/index.ts'),
}

const labCache = new Map<TrackId, Promise<Bundle>>()

export function loadLabBundle(track: TrackId): Promise<Bundle> {
  let p = labCache.get(track)
  if (!p) {
    p = labLoaders[track]().then((m) => m.default)
    p.catch(() => labCache.delete(track))
    labCache.set(track, p)
  }
  return p
}

export async function loadLabNote(track: TrackId, slug: string): Promise<string | undefined> {
  const bundle = await loadLabBundle(track)
  return bundle[`./${slug}.md`]
}

export function prefetchLab(track: TrackId) {
  loadLabBundle(track).catch(() => {})
}

let katexPromise: Promise<typeof import('katex')['default']> | null = null

/** KaTeX (+ its stylesheet) is only needed by the lab notes, so load it on demand. */
export function loadKatex() {
  if (!katexPromise) {
    katexPromise = Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([m]) => m.default)
    katexPromise.catch(() => {
      katexPromise = null
    })
  }
  return katexPromise
}

let faqPromise: Promise<FaqItem[]> | null = null

export function loadFaq(): Promise<FaqItem[]> {
  if (!faqPromise) {
    faqPromise = import('../content/faq/index.ts').then((m) => {
      const files = m.default as Bundle
      return faqCategories.flatMap((c) => parseFaq(files[`./${c.id}.md`] ?? '', c.id))
    })
    faqPromise.catch(() => {
      faqPromise = null
    })
  }
  return faqPromise
}

function parseFaq(md: string, category: FaqCategoryId): FaqItem[] {
  const used = new Set<string>()
  return md
    .split(/^## /m)
    .slice(1)
    .map((block, index) => {
      const nl = block.indexOf('\n')
      const question = (nl === -1 ? block : block.slice(0, nl)).trim()
      const answer = nl === -1 ? '' : block.slice(nl + 1).trim()
      let id = `${category}-${slugify(question).slice(0, 64).replace(/-$/, '')}`
      while (used.has(id)) id += '-x'
      used.add(id)
      return { id, category, question, answer, index }
    })
}

export type { Bundle }
