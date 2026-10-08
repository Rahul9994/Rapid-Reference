import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import { navLinks } from '../../data/site'
import { mobileMenuOpen, paletteOpen } from '../../lib/atom'
import { cn } from '../../lib/utils'
import { useScrolled } from '../../hooks'
import { Logo } from '../ui/Logo'
import { Kbd, ModKey } from '../ui/misc'
import { ThemePicker } from '../theme/ThemePicker'
import { MobileMenu } from './MobileMenu'

export function isActivePath(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
}

function Hamburger({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-[18px]" aria-hidden="true">
      <span
        className={cn(
          'absolute left-0 h-[1.8px] w-full rounded-full bg-current transition-all duration-300 ease-[var(--ease-out-quint)]',
          open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0.5',
        )}
      />
      <span
        className={cn(
          'absolute left-0 h-[1.8px] rounded-full bg-current transition-all duration-300 ease-[var(--ease-out-quint)]',
          open ? 'top-1/2 w-full -translate-y-1/2 -rotate-45' : 'bottom-0.5 w-2/3',
        )}
      />
    </span>
  )
}

export function Navbar() {
  const scrolled = useScrolled(16)
  const { pathname } = useLocation()
  const menuOpen = mobileMenuOpen.use()

  useEffect(() => {
    mobileMenuOpen.set(false)
  }, [pathname])

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.6rem,env(safe-area-inset-top))] sm:px-0 sm:pt-3">
        <nav
          aria-label="Primary"
          className={cn(
            'pointer-events-auto flex w-full items-center justify-between gap-3 rounded-full border transition-[max-width,height,padding,background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-out-expo)]',
            scrolled || menuOpen
              ? 'glass h-[52px] max-w-[880px] border-line-strong pl-3 pr-2 shadow-[var(--shadow-lift)] sm:w-[calc(100%-2rem)] sm:pl-4'
              : 'h-[60px] max-w-[1240px] border-transparent bg-transparent pl-2 pr-1 sm:pl-8 sm:pr-8',
          )}
        >
          <Link to="/" className="rounded-full outline-offset-4" aria-label="Rapid_Reference home">
            <Logo />
          </Link>

          <ul className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((l) => {
              const active = isActivePath(pathname, l.to)
              return (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative block rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors duration-200',
                      active ? 'text-fg' : 'text-muted hover:text-fg',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-full border border-line-strong bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    {l.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => paletteOpen.set(true)}
              aria-label="Search (Ctrl+K)"
              className="group hidden h-9 items-center gap-2 rounded-full border border-line bg-[color-mix(in_oklab,var(--fg)_3%,transparent)] pl-3 pr-1.5 text-[13px] text-subtle transition-[border-color,color,background-color] duration-300 hover:border-line-strong hover:text-muted lg:flex"
            >
              <Search size={14} className="transition-transform duration-300 group-hover:scale-110" />
              <span className="pr-6">Search…</span>
              <span className="flex gap-0.5">
                <Kbd>
                  <ModKey />
                </Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>
            <button
              onClick={() => paletteOpen.set(true)}
              aria-label="Search"
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-fg lg:hidden"
            >
              <Search size={16} />
            </button>
            <ThemePicker />
            <button
              onClick={() => mobileMenuOpen.set((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-fg transition-colors hover:border-line-strong md:hidden"
            >
              <Hamburger open={menuOpen} />
            </button>
          </div>
        </nav>
      </header>
      <MobileMenu />
    </>
  )
}
