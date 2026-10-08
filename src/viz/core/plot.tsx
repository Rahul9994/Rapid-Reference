import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate } from 'motion/react'
import { cn } from '../../lib/utils'
import { useSize } from './hooks'
import { fmt, scaleLinear, type Scale } from './math'

export interface Box {
  width: number
  height: number
}

/**
 * Responsive drawing surface: measures its width, derives a height from
 * `aspect` (clamped), and renders children with the real pixel size so text
 * and strokes stay crisp at every breakpoint.
 */
export function Stage({
  aspect = 0.62,
  min = 240,
  max = 560,
  className,
  children,
}: {
  aspect?: number
  min?: number
  max?: number
  className?: string
  children: (box: Box) => ReactNode
}) {
  const [ref, size] = useSize<HTMLDivElement>()
  const height = Math.round(Math.min(max, Math.max(min, size.width * aspect)))
  return (
    <div ref={ref} className={cn('relative w-full select-none', className)} style={{ height }}>
      {size.width > 0 && children({ width: Math.round(size.width), height })}
    </div>
  )
}

export interface Frame2D {
  sx: Scale
  sy: Scale
  /** Plot area in px */
  left: number
  right: number
  top: number
  bottom: number
}

export function frame2d(
  box: Box,
  xDomain: [number, number],
  yDomain: [number, number],
  pad: { l?: number; r?: number; t?: number; b?: number } = {},
): Frame2D {
  const left = pad.l ?? 40
  const right = box.width - (pad.r ?? 16)
  const top = pad.t ?? 16
  const bottom = box.height - (pad.b ?? 30)
  return { sx: scaleLinear(xDomain, [left, right]), sy: scaleLinear(yDomain, [bottom, top]), left, right, top, bottom }
}

/** Grid lines + tick labels for a 2-D plot. */
export function Axes({
  f,
  xTicks = 6,
  yTicks = 5,
  xLabel,
  yLabel,
  digits = 0,
  showX = true,
  showY = true,
  zeroLines = false,
}: {
  f: Frame2D
  xTicks?: number
  yTicks?: number
  xLabel?: string
  yLabel?: string
  digits?: number
  showX?: boolean
  showY?: boolean
  zeroLines?: boolean
}) {
  const xs = f.sx.ticks(xTicks)
  const ys = f.sy.ticks(yTicks)
  const label = (v: number) => (digits === 0 ? String(Math.round(v * 100) / 100).replace('-', '−') : fmt(v, digits))
  return (
    <g aria-hidden="true" className="font-mono">
      {xs.map((v) => (
        <line key={`gx${v}`} x1={f.sx(v)} x2={f.sx(v)} y1={f.top} y2={f.bottom} className="viz-grid" />
      ))}
      {ys.map((v) => (
        <line key={`gy${v}`} x1={f.left} x2={f.right} y1={f.sy(v)} y2={f.sy(v)} className="viz-grid" />
      ))}
      {zeroLines && f.sx.domain[0] < 0 && f.sx.domain[1] > 0 && (
        <line x1={f.sx(0)} x2={f.sx(0)} y1={f.top} y2={f.bottom} className="viz-axis" />
      )}
      {zeroLines && f.sy.domain[0] < 0 && f.sy.domain[1] > 0 && (
        <line x1={f.left} x2={f.right} y1={f.sy(0)} y2={f.sy(0)} className="viz-axis" />
      )}
      <line x1={f.left} x2={f.right} y1={f.bottom} y2={f.bottom} className="viz-axis" />
      <line x1={f.left} x2={f.left} y1={f.top} y2={f.bottom} className="viz-axis" />
      {showX &&
        xs.map((v) => (
          <text key={`tx${v}`} x={f.sx(v)} y={f.bottom + 15} textAnchor="middle" className="viz-tick">
            {label(v)}
          </text>
        ))}
      {showY &&
        ys.map((v) => (
          <text key={`ty${v}`} x={f.left - 7} y={f.sy(v) + 3.5} textAnchor="end" className="viz-tick">
            {label(v)}
          </text>
        ))}
      {xLabel && (
        <text x={f.right} y={f.bottom - 7} textAnchor="end" className="viz-label">
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text x={f.left + 7} y={f.top + 11} className="viz-label">
          {yLabel}
        </text>
      )}
    </g>
  )
}

/** Polyline path from points. */
export function pathOf(points: [number, number][], close = false): string {
  if (points.length === 0) return ''
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`
  for (let i = 1; i < points.length; i++) d += `L${points[i][0].toFixed(2)},${points[i][1].toFixed(2)}`
  return close ? `${d}Z` : d
}

/** Sample y = fn(x) across the frame's x domain. */
export function curve(f: Frame2D, fn: (x: number) => number, samples = 120, clip = true): string {
  const [x0, x1] = f.sx.domain
  const [ylo, yhi] = [Math.min(...f.sy.domain), Math.max(...f.sy.domain)]
  const pad = (yhi - ylo) * 0.5
  const pts: [number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const x = x0 + ((x1 - x0) * i) / samples
    let y = fn(x)
    if (!Number.isFinite(y)) continue
    if (clip) y = Math.max(ylo - pad, Math.min(yhi + pad, y))
    pts.push([f.sx(x), f.sy(y)])
  }
  return pathOf(pts)
}

/** Unique clip-path id for a plot area. */
export function ClipRect({ id, f }: { id: string; f: Frame2D }) {
  return (
    <clipPath id={id}>
      <rect x={f.left} y={f.top} width={Math.max(0, f.right - f.left)} height={Math.max(0, f.bottom - f.top)} />
    </clipPath>
  )
}

/**
 * Canvas layer for per-pixel fields (decision regions, loss surfaces).
 * `paint` gets a low-res ImageData grid that is upscaled smoothly.
 */
export function FieldCanvas({
  f,
  resolution = 4,
  paint,
  deps,
  className,
}: {
  f: Frame2D
  resolution?: number
  paint: (x: number, y: number) => [number, number, number, number]
  deps: readonly unknown[]
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const w = Math.max(1, Math.round((f.right - f.left) / resolution))
  const h = Math.max(1, Math.round((f.bottom - f.top) / resolution))
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.width = w
    canvas.height = h
    const img = ctx.createImageData(w, h)
    for (let j = 0; j < h; j++) {
      const y = f.sy.invert(f.top + ((j + 0.5) / h) * (f.bottom - f.top))
      for (let i = 0; i < w; i++) {
        const x = f.sx.invert(f.left + ((i + 0.5) / w) * (f.right - f.left))
        const [r, g, b, a] = paint(x, y)
        const k = (j * w + i) * 4
        img.data[k] = r
        img.data[k + 1] = g
        img.data[k + 2] = b
        img.data[k + 3] = a
      }
    }
    ctx.putImageData(img, 0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, f.left, f.top, f.right, f.bottom, ...deps])
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute', className)}
      style={{ left: f.left, top: f.top, width: f.right - f.left, height: f.bottom - f.top, imageRendering: 'auto' }}
    />
  )
}

/** Frame with equal x/y scaling that contains every point (plus a margin). */
export function fitFrame(
  box: Box,
  points: [number, number][],
  pad: { l?: number; r?: number; t?: number; b?: number } = {},
  margin = 0.12,
): Frame2D {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  let x0 = Math.min(...xs)
  let x1 = Math.max(...xs)
  let y0 = Math.min(...ys)
  let y1 = Math.max(...ys)
  const mx = (x1 - x0 || 1) * margin
  const my = (y1 - y0 || 1) * margin
  x0 -= mx
  x1 += mx
  y0 -= my
  y1 += my
  const w = box.width - (pad.l ?? 40) - (pad.r ?? 16)
  const h = box.height - (pad.t ?? 16) - (pad.b ?? 30)
  const per = Math.max((x1 - x0) / w, (y1 - y0) / h)
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return frame2d(box, [cx - (per * w) / 2, cx + (per * w) / 2], [cy - (per * h) / 2, cy + (per * h) / 2], pad)
}

/** A glowing dot that travels once along an SVG path (restart by changing `key`). */
export function Pulse({ d, reverse = false, color = 'var(--accent)', duration = 0.7, r = 4.5 }: { d: string; reverse?: boolean; color?: string; duration?: number; r?: number }) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pt, setPt] = useState<[number, number] | null>(null)
  useEffect(() => {
    const p = pathRef.current
    if (!p) return
    const L = p.getTotalLength()
    const controls = animate(0, 1, {
      duration,
      ease: 'easeInOut',
      onUpdate: (v) => {
        const q = p.getPointAtLength((reverse ? 1 - v : v) * L)
        setPt([q.x, q.y])
      },
      onComplete: () => setPt(null),
    })
    return () => controls.stop()
  }, [d, reverse, duration])
  return (
    <>
      <path ref={pathRef} d={d} fill="none" stroke="none" />
      {pt && <circle cx={pt[0]} cy={pt[1]} r={r} style={{ fill: color, filter: `drop-shadow(0 0 6px ${color})` }} />}
    </>
  )
}
