/** Small, dependency-free numeric helpers shared by the visualizations. */

/** Deterministic PRNG (mulberry32) so every lab renders the same dataset. */
export function rng(seed = 1) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const normal = (mean = 0, sd = 1) => {
    let u = 0
    while (u === 0) u = next()
    const v = next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const range = (lo: number, hi: number) => lo + (hi - lo) * next()
  const int = (lo: number, hi: number) => Math.floor(range(lo, hi + 1))
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)]
  const shuffle = <T,>(xs: T[]) => {
    for (let i = xs.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[xs[i], xs[j]] = [xs[j], xs[i]]
    }
    return xs
  }
  return { next, normal, range, int, pick, shuffle }
}

export type Rng = ReturnType<typeof rng>

export interface Scale {
  (v: number): number
  invert: (px: number) => number
  domain: [number, number]
  range: [number, number]
  ticks: (count?: number) => number[]
}

export function scaleLinear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  const s = ((v: number) => r0 + (v - d0) * k) as Scale
  s.invert = (px: number) => (k === 0 ? d0 : d0 + (px - r0) / k)
  s.domain = domain
  s.range = range
  s.ticks = (count = 5) => niceTicks(Math.min(d0, d1), Math.max(d0, d1), count)
  return s
}

export function niceTicks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo
  if (!(span > 0)) return [lo]
  const raw = span / Math.max(1, count)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toFixed(10))
  return out
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
export const mean = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0)
export const sum = (xs: number[]) => xs.reduce((s, v) => s + v, 0)
export const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Format a number for read-outs: fixed decimals, "−" sign, no "-0.000". */
export function fmt(v: number | undefined | null, digits = 3): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '—'
  if (!Number.isFinite(v)) return v > 0 ? '∞' : '−∞'
  const s = v.toFixed(digits)
  const zero = Number(s) === 0
  return zero ? (0).toFixed(digits) : s.replace('-', '−')
}

/** Softmax with temperature. */
export function softmax(logits: number[], temperature = 1): number[] {
  const t = Math.max(1e-6, temperature)
  const m = Math.max(...logits)
  const exps = logits.map((l) => Math.exp((l - m) / t))
  const z = sum(exps)
  return exps.map((e) => e / z)
}

/** Ease used for scripted animations. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
