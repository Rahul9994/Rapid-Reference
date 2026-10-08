import { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MarkdownView } from '../notes/MarkdownView'
import { VizMount } from './VizMount'

interface Slot {
  el: HTMLElement
  id: string
  caption: string
}

/**
 * Markdown notes whose ```viz <id>``` placeholders are hydrated with live
 * visualizations through portals (the surrounding HTML stays static).
 */
export const LabNotes = forwardRef<HTMLDivElement, { html: string }>(function LabNotes({ html }, forwarded) {
  const local = useRef<HTMLDivElement | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      local.current = el
      if (typeof forwarded === 'function') forwarded(el)
      else if (forwarded) forwarded.current = el
    },
    [forwarded],
  )

  useLayoutEffect(() => {
    const els = local.current?.querySelectorAll<HTMLElement>('.viz-slot') ?? []
    setSlots(Array.from(els).map((el) => ({ el, id: el.dataset.viz ?? '', caption: el.dataset.caption ?? '' })))
  }, [html])

  return (
    <>
      <MarkdownView ref={setRef} html={html} />
      {slots.map((s, i) =>
        createPortal(
          <figure className="m-0">
            <VizMount id={s.id} />
            {s.caption && <figcaption className="mt-3 text-center text-[13px] text-subtle">{s.caption}</figcaption>}
          </figure>,
          s.el,
          `${s.id}-${i}`,
        ),
      )}
    </>
  )
})
