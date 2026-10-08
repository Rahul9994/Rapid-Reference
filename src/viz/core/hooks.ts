import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

/* ---------- Element size ---------- */

/** Track an element's content-box size with ResizeObserver. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const r = el.getBoundingClientRect()
      setSize((s) => (Math.abs(s.width - r.width) < 0.5 && Math.abs(s.height - r.height) < 0.5 ? s : { width: r.width, height: r.height }))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    // Late layout shifts (fonts, lazy siblings) can land before the observer's first callback.
    const t1 = window.setTimeout(update, 150)
    const t2 = window.setTimeout(update, 600)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', update)
    }
  }, [])
  return [ref, size] as const
}

/* ---------- Visibility ---------- */

/** True while the element is (at least partly) on screen and the tab is visible. */
export function useInView<T extends Element>(rootMargin = '80px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible')
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin })
    io.observe(el)
    const onVis = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [rootMargin])
  return [ref, inView && pageVisible] as const
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

/* ---------- Animation frame ---------- */

/** Call `cb(dtMs, elapsedMs)` every animation frame while `active`. */
export function useFrame(cb: (dt: number, t: number) => void, active = true) {
  const cbRef = useRef(cb)
  cbRef.current = cb
  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    const start = last
    const loop = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      cbRef.current(dt, now - start)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active])
}

/* ---------- Theme colours for <canvas> ---------- */

let themeVersion = 0
const themeListeners = new Set<() => void>()
let themeObserver: MutationObserver | null = null

function subscribeTheme(cb: () => void) {
  themeListeners.add(cb)
  if (!themeObserver && typeof document !== 'undefined') {
    themeObserver = new MutationObserver(() => {
      themeVersion++
      themeListeners.forEach((l) => l())
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
  return () => {
    themeListeners.delete(cb)
  }
}

/** Changes whenever the active theme changes. */
export function useThemeVersion(): number {
  return useSyncExternalStore(subscribeTheme, () => themeVersion, () => 0)
}

export type RGB = [number, number, number]

let probe: CanvasRenderingContext2D | null = null

/** Resolve any CSS colour (including var(--token)) to RGB. */
export function resolveColor(value: string): RGB {
  let v = value.trim()
  const m = /^var\((--[\w-]+)\)$/.exec(v)
  if (m) v = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim()
  if (!probe) probe = document.createElement('canvas').getContext('2d')
  if (!probe) return [128, 128, 128]
  probe.fillStyle = '#808080'
  probe.fillStyle = v
  const s = String(probe.fillStyle)
  if (s.startsWith('#')) {
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
  }
  const nums = s.match(/[\d.]+/g)?.map(Number) ?? [128, 128, 128]
  return [nums[0], nums[1], nums[2]]
}

export const rgba = ([r, g, b]: RGB, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`

/** Read theme tokens as RGB triples, refreshed on theme change. */
export function useThemeColors<K extends string>(tokens: Record<K, string>): Record<K, RGB> {
  const version = useThemeVersion()
  const key = JSON.stringify(tokens)
  return useMemo(() => {
    const out = {} as Record<K, RGB>
    for (const k in tokens) out[k] = resolveColor(tokens[k])
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, key])
}

/** Stable callback identity (latest closure). */
export function useEvent<A extends unknown[], R>(fn: (...args: A) => R) {
  const ref = useRef(fn)
  ref.current = fn
  return useCallback((...args: A) => ref.current(...args), [])
}
