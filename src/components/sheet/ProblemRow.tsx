import { memo, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { ArrowUpRight, FileText } from 'lucide-react'
import type { FlatSheetItem } from '../../lib/sheet'
import { cn } from '../../lib/utils'
import { DifficultyPill } from '../ui/misc'
import { LeetCodeIcon, YoutubeIcon } from '../ui/Icons'

export function CheckBox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean
  onToggle: (e: ReactMouseEvent<HTMLButtonElement>) => void
  label: string
}) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        'relative grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] transition-[background-color,border-color,transform,box-shadow] duration-300 ease-[var(--ease-spring)] active:scale-90',
        checked
          ? 'border-easy bg-easy text-[var(--bg)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--easy)_18%,transparent)]'
          : 'border-line-strong hover:border-[color-mix(in_oklab,var(--easy)_60%,var(--border-strong))] hover:bg-easy/10',
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 24,
            strokeDashoffset: checked ? 0 : 24,
            transition: 'stroke-dashoffset .35s var(--ease-out-quint) .05s',
          }}
        />
      </svg>
    </button>
  )
}

function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-soft hover:text-fg"
    >
      {children}
    </a>
  )
}

export const ProblemRow = memo(function ProblemRow({
  item,
  done,
  flash,
  showSection,
  onToggle,
}: {
  item: FlatSheetItem
  done: boolean
  flash: boolean
  showSection?: boolean
  onToggle: (item: FlatSheetItem, e: ReactMouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <li
      id={`p-${item.id}`}
      className={cn(
        'group relative flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-[background-color,box-shadow] duration-500 sm:items-center sm:px-3',
        done ? 'bg-[color-mix(in_oklab,var(--easy)_5%,transparent)]' : 'hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)]',
        flash && 'bg-accent/12 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_55%,transparent)]',
      )}
    >
      <span className="pt-0.5 sm:pt-0">
        <CheckBox checked={done} onToggle={(e) => onToggle(item, e)} label={`Mark “${item.title}” as ${done ? 'not done' : 'done'}`} />
      </span>
      <span className="hidden w-10 shrink-0 font-mono text-[11.5px] text-subtle tabular sm:block">{String(item.n).padStart(3, '0')}</span>
      <div className="min-w-0 flex-1">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-[14px] leading-snug transition-colors hover:text-accent sm:text-[14.5px]',
            done ? 'text-muted' : 'text-fg',
          )}
        >
          {item.title}
        </a>
        {showSection && <div className="mt-0.5 truncate text-[11.5px] text-subtle">{item.sectionTitle} › {item.groupTitle}</div>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
          <span className="font-mono text-[11px] text-subtle tabular">#{item.n}</span>
          <DifficultyPill difficulty={item.difficulty} className="h-5 px-2 text-[10.5px]" />
        </div>
      </div>
      {item.tags && item.tags.length > 0 && (
        <div className="hidden max-w-[220px] shrink-0 flex-wrap justify-end gap-1 xl:flex">
          {item.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-md border border-line px-1.5 py-0.5 text-[10.5px] text-subtle">
              {t}
            </span>
          ))}
        </div>
      )}
      <DifficultyPill difficulty={item.difficulty} className="hidden w-[70px] shrink-0 justify-center sm:inline-flex" />
      <div className="flex shrink-0 items-center">
        <span className="hidden items-center md:flex">
          {item.article ? (
            <IconLink href={item.article} label="Read article">
              <FileText size={15} />
            </IconLink>
          ) : (
            <span className="w-8" />
          )}
          {item.video ? (
            <IconLink href={item.video} label="Watch video">
              <YoutubeIcon size={16} />
            </IconLink>
          ) : (
            <span className="w-8" />
          )}
          {item.leetcode ? (
            <IconLink href={item.leetcode} label="Solve on LeetCode">
              <LeetCodeIcon size={16} />
            </IconLink>
          ) : (
            <span className="w-8" />
          )}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open “${item.title}” on takeUforward`}
          className="ml-1 inline-flex h-8 items-center gap-1 rounded-lg border border-line px-2.5 text-[12px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
        >
          Open <ArrowUpRight size={13} />
        </a>
      </div>
    </li>
  )
})
