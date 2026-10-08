import { Marked, Renderer, type RendererObject, type RendererThis, type Tokens } from 'marked'
import { hljs } from './highlight'
import { escapeHtml, slugify } from './utils'

export interface TocItem {
  id: string
  text: string
  depth: number
}

export interface RenderedDoc {
  html: string
  toc: TocItem[]
}

/** The subset of KaTeX we use — passed in so KaTeX is only loaded on pages with math. */
export interface MathRenderer {
  renderToString: (tex: string, options?: { displayMode?: boolean; throwOnError?: boolean }) => string
}

export interface RenderOptions {
  /** Enables $inline$ and $$block$$ math. */
  katex?: MathRenderer
}

const svg = (paths: string, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`

const ICON_COPY = svg('<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', 'icon-copy')
const ICON_CHECK = svg('<path d="M20 6 9 17l-5-5"/>', 'icon-check')

const CALLOUTS: Record<string, { title: string; icon: string }> = {
  note: { title: 'Note', icon: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>') },
  tip: { title: 'Tip', icon: svg('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>') },
  warning: { title: 'Common mistakes', icon: svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>') },
  mistake: { title: 'Common mistakes', icon: svg('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>') },
  interview: { title: 'Interview notes', icon: svg('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/>') },
  remember: { title: 'Remember this', icon: svg('<path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/>') },
  important: { title: 'Important', icon: svg('<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>') },
}

const LANG_LABEL: Record<string, string> = { py: 'python', sh: 'bash', shell: 'bash', console: 'bash', text: 'text' }

/**
 * Turn GitHub-style callouts (> [!TIP] Title) into HTML wrappers before lexing,
 * so the body is still parsed as normal Markdown (code, lists, tables...).
 */
function preprocessCallouts(md: string, inline: (s: string) => string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inFence = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*```/.test(line)) inFence = !inFence
    const m = !inFence && /^>\s?\[!([A-Za-z]+)\][ \t]*(.*)$/.exec(line)
    if (!m) {
      out.push(line)
      continue
    }
    const type = m[1].toLowerCase()
    const meta = CALLOUTS[type] ?? CALLOUTS.note
    const title = m[2].trim() ? inline(m[2].trim()) : meta.title
    const body: string[] = []
    while (i + 1 < lines.length && /^>/.test(lines[i + 1])) {
      i++
      body.push(lines[i].replace(/^>\s?/, ''))
    }
    out.push(
      `<div class="callout ${type in CALLOUTS ? type : 'note'}"><div class="callout-title">${meta.icon}<span>${title}</span></div>`,
      '',
      ...body,
      '',
      '</div>',
      '',
    )
  }
  return out.join('\n')
}

function mathExtensions(katex: MathRenderer) {
  const render = (tex: string, displayMode: boolean) => {
    try {
      return katex.renderToString(tex, { displayMode, throwOnError: false })
    } catch {
      return `<code>${escapeHtml(tex)}</code>`
    }
  }
  return [
    {
      name: 'blockMath',
      level: 'block' as const,
      start: (src: string) => src.match(/^\$\$/m)?.index,
      tokenizer(src: string) {
        const m = /^\$\$([\s\S]+?)\$\$[ \t]*(?:\n|$)/.exec(src)
        if (m) return { type: 'blockMath', raw: m[0], text: m[1].trim() }
        return undefined
      },
      renderer: (token: Tokens.Generic) => `<div class="math-block" tabindex="0">${render(token.text as string, true)}</div>\n`,
    },
    {
      name: 'inlineMath',
      level: 'inline' as const,
      start: (src: string) => {
        const i = src.indexOf('$')
        return i < 0 ? undefined : i
      },
      tokenizer(src: string) {
        const m = /^\$((?:\\\$|[^$\n])+?)\$/.exec(src)
        if (m) return { type: 'inlineMath', raw: m[0], text: m[1] }
        return undefined
      },
      renderer: (token: Tokens.Generic) => `<span class="math-inline">${render(token.text as string, false)}</span>`,
    },
  ]
}

export function renderMarkdown(md: string, options: RenderOptions = {}): RenderedDoc {
  const toc: TocItem[] = []
  const used = new Map<string, number>()

  // marked only applies *enumerable* renderer overrides, so this must be a plain
  // object (not a Renderer subclass). `this` is marked's Renderer instance.
  const renderer: RendererObject = {
    heading(this: RendererThis, { tokens, depth }: Tokens.Heading): string {
      const inner = this.parser.parseInline(tokens)
      const plain = inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      let id = slugify(plain) || 'section'
      const n = used.get(id) ?? 0
      used.set(id, n + 1)
      if (n > 0) id = `${id}-${n + 1}`
      if (depth === 2 || depth === 3) toc.push({ id, text: plain, depth })
      const anchor = depth <= 3 ? `<a class="heading-anchor" href="#${id}" aria-label="Link to ${escapeHtml(plain)}">#</a>` : ''
      return `<h${depth} id="${id}">${inner}${anchor}</h${depth}>\n`
    },

    code({ text, lang }: Tokens.Code): string {
      const info = (lang || '').trim()
      const first = info.split(/\s+/)[0]?.toLowerCase() ?? ''
      const rest = info.slice(first.length).trim()

      if (first === 'viz') {
        // Placeholder hydrated with a live React visualization by the lab pages.
        const [id = '', ...caption] = rest.split(/\s+/)
        return `<div class="viz-slot" data-viz="${escapeHtml(id)}" data-caption="${escapeHtml(caption.join(' '))}"></div>\n`
      }

      if (first === 'diagram') {
        const caption = rest ? `<figcaption>${escapeHtml(rest)}</figcaption>` : ''
        return `<figure class="diagram"><pre>${escapeHtml(text)}</pre>${caption}</figure>\n`
      }

      const isOutput = first === 'output'
      const language = LANG_LABEL[first] ?? first
      const canHighlight = !isOutput && language && hljs.getLanguage(language)
      const body = canHighlight ? hljs.highlight(text, { language, ignoreIllegals: true }).value : escapeHtml(text)
      const label = rest || (isOutput ? 'output' : language || 'text')
      const copy = isOutput
        ? ''
        : `<button type="button" class="copy-btn" data-copy aria-label="Copy code">${ICON_COPY}${ICON_CHECK}<span class="copy-label">Copy</span></button>`
      return `<div class="code-block${isOutput ? ' is-output' : ''}"><div class="code-head"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="code-lang">${escapeHtml(label)}</span>${copy}</div><pre tabindex="0"><code class="hljs">${body}</code></pre></div>\n`
    },

    table(this: RendererThis, token: Tokens.Table): string {
      return `<div class="table-wrap" tabindex="0">${Renderer.prototype.table.call(this, token)}</div>\n`
    },

    link(this: RendererThis, token: Tokens.Link): string {
      const html = Renderer.prototype.link.call(this, token)
      if (/^https?:\/\//.test(token.href)) {
        return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ')
      }
      return html
    },
  }

  const marked = new Marked({ gfm: true, breaks: false, renderer })
  if (options.katex) marked.use({ extensions: mathExtensions(options.katex) })
  const source = preprocessCallouts(md, (s) => marked.parseInline(s) as string)
  const html = wrapSections(marked.parse(source) as string)
  return { html, toc }
}

const ICON_CHEVRON = svg('<path d="m6 9 6 6 6-6"/>')

/**
 * Wrap every H2 and the content that follows it in a collapsible <section>.
 * Code is escaped by then, so a raw "<h2 " can only be a real heading.
 */
function wrapSections(html: string): string {
  return html
    .split(/(?=<h2 id=")/)
    .map((part) => {
      if (!part.startsWith('<h2 id="')) return part
      const end = part.indexOf('</h2>') + 5
      const heading = part.slice(0, end)
      const body = part.slice(end)
      const id = /^<h2 id="([^"]+)"/.exec(heading)?.[1] ?? ''
      return `<section class="doc-section" data-section="${id}"><div class="section-head">${heading}<button type="button" class="section-toggle" data-toggle aria-expanded="true" aria-label="Collapse section">${ICON_CHEVRON}</button></div><div class="doc-section-body"><div>${body}</div></div></section>\n`
    })
    .join('')
}

/** Lightweight render for short snippets (FAQ answers). */
export function renderSnippet(md: string): string {
  return renderMarkdown(md).html
}
