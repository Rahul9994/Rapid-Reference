import { rng } from './math'

export interface Point {
  x: number
  y: number
  /** class label (0, 1, 2…) */
  c: number
}

/** Gaussian blobs around the given centres. */
export function blobs(centers: [number, number][], perClass: number, sd: number | [number, number], seed = 1): Point[] {
  const r = rng(seed)
  const [sx, sy] = Array.isArray(sd) ? sd : [sd, sd]
  const out: Point[] = []
  for (let i = 0; i < perClass; i++) {
    centers.forEach(([cx, cy], c) => out.push({ x: cx + r.normal(0, sx), y: cy + r.normal(0, sy), c }))
  }
  return out
}

/** Two interleaving half-moons in roughly [-1.2, 2.2] × [-0.8, 1.2]. */
export function moons(n: number, noise = 0.1, seed = 1): Point[] {
  const r = rng(seed)
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const t = (Math.PI * i) / (n - 1)
    out.push({ x: Math.cos(t) + r.normal(0, noise), y: Math.sin(t) + r.normal(0, noise), c: 0 })
    out.push({ x: 1 - Math.cos(t) + r.normal(0, noise), y: 0.5 - Math.sin(t) + r.normal(0, noise), c: 1 })
  }
  return out
}

/** Inner disc vs outer ring, centred at 0. */
export function circles(n: number, noise = 0.08, seed = 1): Point[] {
  const r = rng(seed)
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const a = r.range(0, Math.PI * 2)
    const inner = i % 2 === 0
    const rad = (inner ? 0.42 : 1) + r.normal(0, noise)
    out.push({ x: rad * Math.cos(a), y: rad * Math.sin(a), c: inner ? 1 : 0 })
  }
  return out
}

/** XOR quadrants in [-1, 1]². */
export function xor(n: number, seed = 1): Point[] {
  const r = rng(seed)
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const x = r.range(-1, 1)
    const y = r.range(-1, 1)
    if (Math.abs(x) < 0.08 || Math.abs(y) < 0.08) continue
    out.push({ x, y, c: x * y > 0 ? 1 : 0 })
  }
  return out
}

/** Two-arm spiral. */
export function spiral(n: number, noise = 0.06, seed = 1): Point[] {
  const r = rng(seed)
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 3.2
    for (const c of [0, 1]) {
      const a = t * 1.75 + c * Math.PI
      const rad = 0.12 + t * 0.27
      out.push({ x: rad * Math.cos(a) + r.normal(0, noise), y: rad * Math.sin(a) + r.normal(0, noise), c })
    }
  }
  return out
}

/** Theme colours for class labels, in order. */
export const CLASS_COLORS = ['var(--accent-2)', 'var(--accent-3)', 'var(--accent)', 'var(--easy)', 'var(--medium)', 'var(--hard)']
export const CLASS_TOKENS = ['--accent-2', '--accent-3', '--accent', '--easy', '--medium', '--hard'] as const
