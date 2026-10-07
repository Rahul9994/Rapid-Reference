import { Fragment, useMemo } from 'react'
import { escapeRegExp } from '../../lib/utils'

/** Wrap every occurrence of the query's words in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => {
    const tokens = query
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
    if (tokens.length === 0) return [text]
    return text.split(new RegExp(`(${tokens.join('|')})`, 'gi'))
  }, [text, query])

  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-[4px] bg-accent/22 px-0.5 text-fg">
            {p}
          </mark>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}
