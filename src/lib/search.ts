import { noteCategories } from '../data/notes'
import { faqCategories } from '../data/faq'
import { loadFaq, loadNoteBundle } from './content'
import { flattenSheet, loadSheet } from './sheet'
import { slugify, stripMarkdown } from './utils'

export type SearchKind = 'topic' | 'section' | 'faq' | 'problem'

export interface SearchDoc {
  id: string
  kind: SearchKind
  group: string
  title: string
  subtitle: string
  text: string
  url: string
  external?: string
  difficulty?: string | null
  titleLower: string
  hay: string
}

export interface SearchGroup {
  group: string
  results: SearchDoc[]
  best: number
}

let indexPromise: Promise<SearchDoc[]> | null = null

function doc(d: Omit<SearchDoc, 'titleLower' | 'hay'>): SearchDoc {
  const titleLower = d.title.toLowerCase()
  return { ...d, titleLower, hay: `${titleLower} ${d.subtitle.toLowerCase()} ${d.text.toLowerCase()}` }
}

/** Split a topic's Markdown into sections keyed by the same heading ids the renderer emits. */
function splitSections(md: string) {
  const used = new Map<string, number>()
  const sections: { id: string; heading: string; depth: number; body: string[] }[] = []
  let current: { id: string; heading: string; depth: number; body: string[] } | null = null
  let inFence = false
  for (const line of md.split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence
    const m = !inFence && /^(#{1,6})\s+(.+?)\s*#*$/.exec(line)
    if (m) {
      const plain = m[2].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*]/g, '').replace(/<[^>]+>/g, '')
      let id = slugify(plain) || 'section'
      const n = used.get(id) ?? 0
      used.set(id, n + 1)
      if (n > 0) id = `${id}-${n + 1}`
      const depth = m[1].length
      if (depth === 2 || depth === 3) {
        current = { id, heading: plain, depth, body: [] }
        sections.push(current)
        continue
      }
    }
    current?.body.push(line)
  }
  return sections
}

export function buildSearchIndex(): Promise<SearchDoc[]> {
  if (indexPromise) return indexPromise
  indexPromise = (async () => {
    const docs: SearchDoc[] = []

    const bundles = await Promise.all(noteCategories.map((c) => loadNoteBundle(c.id)))
    noteCategories.forEach((cat, ci) => {
      const bundle = bundles[ci]
      for (const topic of cat.topics) {
        const md = bundle[`./${topic.slug}.md`] ?? ''
        const base = `/notes/${cat.id}/${topic.slug}`
        docs.push(
          doc({
            id: `t:${cat.id}/${topic.slug}`,
            kind: 'topic',
            group: cat.short === 'DSA' ? 'DSA Notes' : cat.title,
            title: topic.title,
            subtitle: `${cat.short} · ${topic.summary}`,
            text: stripMarkdown(md.slice(0, 1200)),
            url: base,
          }),
        )
        for (const s of splitSections(md)) {
          docs.push(
            doc({
              id: `s:${cat.id}/${topic.slug}#${s.id}`,
              kind: 'section',
              group: cat.short === 'DSA' ? 'DSA Notes' : cat.title,
              title: s.heading,
              subtitle: `${cat.short} › ${topic.title}`,
              text: stripMarkdown(s.body.join('\n')).slice(0, 1500),
              url: `${base}#${s.id}`,
            }),
          )
        }
      }
    })

    const faqs = await loadFaq()
    const faqTitle = Object.fromEntries(faqCategories.map((c) => [c.id, c.title]))
    for (const f of faqs) {
      docs.push(
        doc({
          id: `f:${f.id}`,
          kind: 'faq',
          group: 'Interview FAQ',
          title: f.question.replace(/`/g, ''),
          subtitle: `FAQ · ${faqTitle[f.category]}`,
          text: stripMarkdown(f.answer).slice(0, 1200),
          url: `/faq?q=${encodeURIComponent(f.id)}`,
        }),
      )
    }

    const sheet = await loadSheet()
    for (const it of flattenSheet(sheet)) {
      docs.push(
        doc({
          id: `p:${it.id}`,
          kind: 'problem',
          group: 'DSA Sheet',
          title: it.title,
          subtitle: `#${it.n} · ${it.sectionTitle} › ${it.groupTitle}`,
          text: (it.tags ?? []).join(' '),
          url: `/dsa-sheet?focus=${it.id}`,
          external: it.url,
          difficulty: it.difficulty,
        }),
      )
    }

    return docs
  })()
  indexPromise.catch(() => {
    indexPromise = null
  })
  return indexPromise
}

const GROUP_ORDER = ['Python', 'DSA Notes', 'Operating Systems', 'Database Management Systems', 'Computer Networks', 'Interview FAQ', 'DSA Sheet']

export function searchIndex(docs: SearchDoc[], query: string, perGroup = 5): SearchGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const tokens = q.split(/\s+/).filter(Boolean)
  const scored: { d: SearchDoc; score: number }[] = []

  for (const d of docs) {
    let ok = true
    for (const t of tokens) {
      if (!d.hay.includes(t)) {
        ok = false
        break
      }
    }
    if (!ok) continue
    let score = 0
    let inHeader = false
    if (d.titleLower === q) score += 120
    else if (d.titleLower.startsWith(q)) score += 70
    else if (d.titleLower.includes(q)) score += 45
    const subtitleLower = d.subtitle.toLowerCase()
    for (const t of tokens) {
      if (d.titleLower.includes(t)) {
        score += 14
        inHeader = true
        if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(d.titleLower)) score += 6
      }
      if (subtitleLower.includes(t)) {
        score += 9
        inHeader = true
      }
    }
    // Structural bonuses only count when the match is in the title/summary, so a
    // passing mention deep in a page's body doesn't outrank a focused result.
    if (inHeader && d.kind === 'topic') score += 16
    if (inHeader && d.kind === 'section') score += 3
    score -= Math.min(d.title.length, 80) / 40
    scored.push({ d, score })
  }

  scored.sort((a, b) => b.score - a.score)
  const groups = new Map<string, SearchGroup>()
  for (const { d, score } of scored) {
    let g = groups.get(d.group)
    if (!g) {
      g = { group: d.group, results: [], best: score }
      groups.set(d.group, g)
    }
    if (g.results.length < perGroup) g.results.push(d)
  }
  return [...groups.values()].sort(
    (a, b) => b.best - a.best || GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group),
  )
}

/** Return a short excerpt of `text` around the first query token. */
export function excerpt(text: string, query: string, radius = 70): string {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  const lower = text.toLowerCase()
  let at = -1
  for (const t of tokens) {
    at = lower.indexOf(t)
    if (at >= 0) break
  }
  if (at < 0) return text.slice(0, radius * 2)
  let start = Math.max(0, at - radius)
  if (start > 0) {
    const space = text.indexOf(' ', start)
    if (space !== -1 && space < at) start = space + 1    // don't cut a word in half
  }
  const end = Math.min(text.length, at + radius)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}
