import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const base =
  'group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium outline-none transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-[var(--ease-out-quint)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent shadow-[0_1px_0_0_color-mix(in_oklab,white_30%,transparent)_inset,0_8px_24px_-8px_color-mix(in_oklab,var(--accent)_70%,transparent)] hover:-translate-y-0.5 hover:shadow-[0_1px_0_0_color-mix(in_oklab,white_30%,transparent)_inset,0_14px_36px_-10px_color-mix(in_oklab,var(--accent)_85%,transparent)] overflow-hidden',
  secondary:
    'glass border border-line-strong text-fg hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border-strong))] hover:bg-[color-mix(in_oklab,var(--bg-elev)_85%,var(--accent))]',
  outline: 'border border-line text-fg hover:border-line-strong hover:bg-soft',
  ghost: 'text-muted hover:text-fg hover:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-[13px]',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px] sm:h-[52px] sm:px-7',
  icon: 'h-10 w-10',
}

export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

/** Light sweep that crosses primary buttons on hover. */
function Shine() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-[var(--ease-out-quint)] group-hover/btn:translate-x-[420%] group-hover/btn:opacity-100"
    />
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props}>
      {variant === 'primary' && <Shine />}
      {children}
    </button>
  )
})

interface ButtonLinkProps extends LinkProps {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function ButtonLink({ variant = 'secondary', size = 'md', className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, typeof className === 'string' ? className : undefined)} {...props}>
      {variant === 'primary' && <Shine />}
      {children}
    </Link>
  )
}
