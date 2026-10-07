import { forwardRef, memo, type MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { copyText, cn, scrollToHeading } from '../../lib/utils'
import { toast } from '../../lib/toast'

interface Props {
  html: string
  className?: string
}

/**
 * Renders pre-built Markdown HTML and wires up its interactive bits with one
 * delegated click handler: copy buttons, section toggles, heading anchors and
 * internal links (routed client-side).
 */
export const MarkdownView = memo(
  forwardRef<HTMLDivElement, Props>(function MarkdownView({ html, className }, ref) {
    const navigate = useNavigate()

    const onClick = (e: ReactMouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement

      const copyBtn = target.closest<HTMLButtonElement>('[data-copy]')
      if (copyBtn) {
        const code = copyBtn.closest('.code-block')?.querySelector('code')?.textContent ?? ''
        copyText(code).then((ok) => {
          if (!ok) {
            toast('Copy failed', { tone: 'error' })
            return
          }
          const label = copyBtn.querySelector('.copy-label')
          copyBtn.classList.add('copied')
          if (label) label.textContent = 'Copied!'
          window.setTimeout(() => {
            copyBtn.classList.remove('copied')
            if (label) label.textContent = 'Copy'
          }, 1800)
        })
        return
      }

      const toggle = target.closest<HTMLButtonElement>('[data-toggle]')
      if (toggle) {
        const section = toggle.closest('.doc-section')
        const collapsed = section?.classList.toggle('collapsed') ?? false
        toggle.setAttribute('aria-expanded', String(!collapsed))
        toggle.setAttribute('aria-label', collapsed ? 'Expand section' : 'Collapse section')
        return
      }

      const anchor = target.closest<HTMLAnchorElement>('a')
      if (anchor) {
        const href = anchor.getAttribute('href') ?? ''
        if (href.startsWith('#')) {
          e.preventDefault()
          const id = decodeURIComponent(href.slice(1))
          if (scrollToHeading(id)) history.replaceState(history.state, '', `#${id}`)
          if (anchor.classList.contains('heading-anchor')) {
            copyText(window.location.href).then((ok) => ok && toast('Link copied', { tone: 'success', duration: 1600 }))
          }
        } else if (href.startsWith('/')) {
          e.preventDefault()
          navigate(href)
        }
      }
    }

    return (
      <div
        ref={ref}
        className={cn('prose-rr', className)}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }),
)
