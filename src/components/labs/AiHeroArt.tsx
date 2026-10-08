import { useEffect, useMemo, useRef, useState } from 'react'
import { rng } from '../../viz/core/math'
import { rgba, useInView, useReducedMotion, useThemeColors } from '../../viz/core/hooks'

/**
 * Landing art for A.I: a constellation graph where an A* search keeps
 * expanding from a start node to a goal, then traces the path it found.
 */

interface Graph {
  nodes: { x: number; y: number; phase: number }[]
  adj: number[][]
  edges: [number, number][]
}

function buildGraph(): Graph {
  const r = rng(11)
  const nodes: Graph['nodes'] = []
  const cols = 10
  const rows = 8
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (r.next() < 0.14) continue
      nodes.push({ x: (i + 0.5 + r.range(-0.32, 0.32)) / cols, y: (j + 0.5 + r.range(-0.32, 0.32)) / rows, phase: r.range(0, Math.PI * 2) })
    }
  }
  const adj: number[][] = nodes.map(() => [])
  const key = new Set<string>()
  const edges: [number, number][] = []
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, (a.y - b.y) * 0.8) }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
    for (const { j } of near) {
      const k = i < j ? `${i}-${j}` : `${j}-${i}`
      if (key.has(k)) continue
      key.add(k)
      edges.push([i, j])
      adj[i].push(j)
      adj[j].push(i)
    }
  })
  return { nodes, adj, edges }
}

/** A* from s to g; returns expansion order + parents. */
function astar(G: Graph, s: number, g: number) {
  const h = (i: number) => Math.hypot(G.nodes[i].x - G.nodes[g].x, G.nodes[i].y - G.nodes[g].y)
  const d = (i: number, j: number) => Math.hypot(G.nodes[i].x - G.nodes[j].x, G.nodes[i].y - G.nodes[j].y)
  const gScore = new Map<number, number>([[s, 0]])
  const parent = new Map<number, number>()
  const open = new Set([s])
  const closed = new Set<number>()
  const order: number[] = []
  while (open.size) {
    let best = -1
    let bestF = Infinity
    for (const i of open) {
      const f = (gScore.get(i) ?? Infinity) + h(i)
      if (f < bestF) {
        bestF = f
        best = i
      }
    }
    open.delete(best)
    closed.add(best)
    order.push(best)
    if (best === g) break
    for (const j of G.adj[best]) {
      if (closed.has(j)) continue
      const t = (gScore.get(best) ?? 0) + d(best, j)
      if (t < (gScore.get(j) ?? Infinity)) {
        gScore.set(j, t)
        parent.set(j, best)
        open.add(j)
      }
    }
  }
  const path: number[] = []
  if (closed.has(g)) {
    let c: number | undefined = g
    while (c !== undefined) {
      path.unshift(c)
      c = parent.get(c)
    }
  }
  return { order, parent, path }
}

export default function AiHeroArt() {
  const G = useMemo(buildGraph, [])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [wrapRef, inView] = useInView<HTMLDivElement>('0px')
  const colors = useThemeColors({ fg: 'var(--fg)', a: 'var(--accent)', b: 'var(--accent-2)', c: 'var(--accent-3)' })
  const [stats, setStats] = useState({ expanded: 0, path: 0 })
  const colorsRef = useRef(colors)
  colorsRef.current = colors

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const r = rng(5)
    let raf = 0
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const pickPair = () => {
      for (let tries = 0; tries < 50; tries++) {
        const s = r.int(0, G.nodes.length - 1)
        const g = r.int(0, G.nodes.length - 1)
        const a = G.nodes[s]
        const b = G.nodes[g]
        if (Math.hypot(a.x - b.x, a.y - b.y) > 0.6) {
          const res = astar(G, s, g)
          if (res.path.length > 3) return { s, g, ...res }
        }
      }
      return { s: 0, g: G.nodes.length - 1, ...astar(G, 0, G.nodes.length - 1) }
    }

    let run = pickPair()
    let phase: 'search' | 'path' | 'hold' | 'fade' = 'search'
    let phaseT = 0
    let expanded = reduced ? run.order.length : 0
    if (reduced) phase = 'hold'
    let lastStats = -1

    const pos = (i: number, t: number) => {
      const n = G.nodes[i]
      const drift = reduced ? 0 : 5
      return [n.x * w + Math.sin(t * 0.00045 + n.phase) * drift, n.y * h + Math.cos(t * 0.0004 + n.phase * 1.3) * drift] as const
    }

    const draw = (t: number, dt: number) => {
      const C = colorsRef.current
      phaseT += dt
      if (phase === 'search') {
        const target = Math.min(run.order.length, Math.floor(phaseT / 85))
        expanded = target
        if (expanded >= run.order.length) {
          phase = 'path'
          phaseT = 0
        }
      } else if (phase === 'path' && phaseT > 900) {
        phase = 'hold'
        phaseT = 0
      } else if (phase === 'hold' && phaseT > 1800 && !reduced) {
        phase = 'fade'
        phaseT = 0
      } else if (phase === 'fade' && phaseT > 650) {
        run = pickPair()
        phase = 'search'
        phaseT = 0
        expanded = 0
      }
      const fade = phase === 'fade' ? 1 - phaseT / 650 : 1
      const done = phase === 'path' || phase === 'hold' || phase === 'fade'
      if (expanded !== lastStats) {
        lastStats = expanded
        setStats({ expanded, path: done ? run.path.length : 0 })
      }

      ctx.clearRect(0, 0, w, h)
      const visited = new Set(run.order.slice(0, expanded))

      // base edges
      ctx.lineWidth = 1
      ctx.strokeStyle = rgba(C.fg, 0.08)
      ctx.beginPath()
      for (const [i, j] of G.edges) {
        const [x1, y1] = pos(i, t)
        const [x2, y2] = pos(j, t)
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
      }
      ctx.stroke()

      // search tree
      ctx.strokeStyle = rgba(C.b, 0.45 * fade)
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (const i of visited) {
        const p = run.parent.get(i)
        if (p === undefined) continue
        const [x1, y1] = pos(i, t)
        const [x2, y2] = pos(p, t)
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
      }
      ctx.stroke()

      // path
      if (done) {
        const k = phase === 'path' ? Math.min(1, phaseT / 900) : 1
        const segs = (run.path.length - 1) * k
        ctx.save()
        ctx.shadowColor = rgba(C.a, 0.9 * fade)
        ctx.shadowBlur = 14
        ctx.strokeStyle = rgba(C.a, fade)
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let s = 0; s < Math.ceil(segs); s++) {
          const [x1, y1] = pos(run.path[s], t)
          const [x2, y2] = pos(run.path[s + 1], t)
          const f = Math.min(1, segs - s)
          if (s === 0) ctx.moveTo(x1, y1)
          ctx.lineTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f)
        }
        ctx.stroke()
        ctx.restore()
      }

      // nodes
      G.nodes.forEach((_, i) => {
        const [x, y] = pos(i, t)
        const isV = visited.has(i)
        ctx.beginPath()
        ctx.arc(x, y, isV ? 3.2 : 2.4, 0, Math.PI * 2)
        ctx.fillStyle = isV ? rgba(C.b, 0.9 * fade + 0.1) : rgba(C.fg, 0.28)
        ctx.fill()
      })

      // frontier pulse on the newest expansion
      if (phase === 'search' && expanded > 0) {
        const i = run.order[expanded - 1]
        const [x, y] = pos(i, t)
        ctx.beginPath()
        ctx.arc(x, y, 9, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(C.c, 0.85)
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // start + goal
      for (const [i, col] of [
        [run.s, C.a],
        [run.g, C.c],
      ] as const) {
        const [x, y] = pos(i, t)
        const pulse = reduced ? 0 : (t % 1600) / 1600
        ctx.beginPath()
        ctx.arc(x, y, 7 + pulse * 16, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(col, (1 - pulse) * 0.6 * fade)
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, 6.5, 0, Math.PI * 2)
        ctx.fillStyle = rgba(col, Math.max(0.35, fade))
        ctx.fill()
      }
    }

    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      draw(now, dt)
      if (!reduced && inView) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [G, reduced, inView])

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute bottom-[14%] right-[6%] hidden lg:block">
        <div className="glass rounded-2xl border border-line-strong px-4 py-3 shadow-[var(--shadow-lift)]">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-subtle">A* search · live</div>
          <div className="mt-2 flex gap-5 font-mono text-[12.5px]">
            <span className="text-muted">
              expanded <span className="text-fg tabular">{String(stats.expanded).padStart(2, '0')}</span>
            </span>
            <span className="text-muted">
              path <span className="tabular text-accent">{stats.path ? `${stats.path} nodes` : '…'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
