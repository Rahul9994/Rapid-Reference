import { motion } from 'motion/react'
import type { Box } from '../core/plot'
import { fmt } from '../core/math'

/** Shared grid-world model + renderer for the MDP and Q-learning labs. */

export interface World {
  W: number
  H: number
  walls: Set<string>
  terminals: Map<string, number>
  start: [number, number]
  /** y grows downward in this model (row 0 = top) */
}

export const key = (x: number, y: number) => `${x},${y}`
export const ACTIONS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const // up, right, down, left
export const ARROWS = ['↑', '→', '↓', '←']

export function move(w: World, x: number, y: number, a: number): [number, number] {
  const nx = x + ACTIONS[a][0]
  const ny = y + ACTIONS[a][1]
  if (nx < 0 || ny < 0 || nx >= w.W || ny >= w.H || w.walls.has(key(nx, ny))) return [x, y]
  return [nx, ny]
}

/** Diverging fill for a value in [-1, 1]. */
export function valueFill(v: number, max = 1) {
  const t = Math.max(-1, Math.min(1, v / max))
  if (Math.abs(t) < 0.02) return 'color-mix(in oklab, var(--fg) 5%, transparent)'
  return `color-mix(in oklab, ${t > 0 ? 'var(--easy)' : 'var(--hard)'} ${Math.round(10 + Math.abs(t) * 55)}%, transparent)`
}

export function GridBoard({
  box,
  world,
  values,
  q,
  policy,
  agent,
  focus,
  trail,
  showNumbers = true,
}: {
  box: Box
  world: World
  values?: Map<string, number>
  q?: Map<string, number[]>
  policy?: Map<string, number>
  agent?: [number, number]
  focus?: string
  trail?: [number, number][]
  showNumbers?: boolean
}) {
  const cell = Math.min((box.width - 20) / world.W, (box.height - 20) / world.H)
  const ox = (box.width - cell * world.W) / 2
  const oy = (box.height - cell * world.H) / 2
  const cells: [number, number][] = []
  for (let y = 0; y < world.H; y++) for (let x = 0; x < world.W; x++) cells.push([x, y])
  const qMax = q ? Math.max(0.2, ...[...q.values()].flat().map(Math.abs)) : 1
  const fs = Math.max(9, Math.min(15, cell * 0.17))
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Grid world">
      {cells.map(([x, y]) => {
        const k = key(x, y)
        const X = ox + x * cell
        const Y = oy + y * cell
        if (world.walls.has(k)) {
          return <rect key={k} x={X + 2} y={Y + 2} width={cell - 4} height={cell - 4} rx={8} style={{ fill: 'color-mix(in oklab, var(--fg) 55%, transparent)' }} />
        }
        const term = world.terminals.get(k)
        const v = values?.get(k)
        const qs = q?.get(k)
        const cx = X + cell / 2
        const cy = Y + cell / 2
        return (
          <g key={k}>
            <rect
              x={X + 2}
              y={Y + 2}
              width={cell - 4}
              height={cell - 4}
              rx={8}
              strokeWidth={focus === k ? 2.5 : 1}
              style={{
                fill: term !== undefined ? valueFill(term) : v !== undefined ? valueFill(v) : 'color-mix(in oklab, var(--fg) 4%, transparent)',
                stroke: focus === k ? 'var(--accent)' : 'var(--border)',
                transition: 'fill 0.35s',
              }}
            />
            {qs && term === undefined &&
              qs.map((qv, a) => {
                const pts = [
                  [cx, cy],
                  a === 0 ? [X + 4, Y + 4] : a === 1 ? [X + cell - 4, Y + 4] : a === 2 ? [X + cell - 4, Y + cell - 4] : [X + 4, Y + cell - 4],
                  a === 0 ? [X + cell - 4, Y + 4] : a === 1 ? [X + cell - 4, Y + cell - 4] : a === 2 ? [X + 4, Y + cell - 4] : [X + 4, Y + 4],
                ]
                return <path key={a} d={`M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}L${pts[2][0]},${pts[2][1]}Z`} style={{ fill: valueFill(qv, qMax), stroke: 'var(--bg)', strokeWidth: 1, transition: 'fill 0.3s' }} />
              })}
            {term !== undefined ? (
              <text x={cx} y={cy + fs * 0.4} textAnchor="middle" fontSize={fs * 1.25} fontWeight={700} style={{ fill: term > 0 ? 'var(--easy)' : 'var(--hard)' }}>
                {term > 0 ? `+${term}` : term}
              </text>
            ) : (
              <>
                {policy?.has(k) && (
                  <text x={cx} y={cy + (showNumbers && v !== undefined ? -fs * 0.25 : fs * 0.45)} textAnchor="middle" fontSize={fs * 1.3} fontWeight={700} style={{ fill: 'var(--fg)', opacity: 0.85 }}>
                    {ARROWS[policy.get(k)!]}
                  </text>
                )}
                {showNumbers && v !== undefined && (
                  <text x={cx} y={cy + fs * (policy?.has(k) ? 1.15 : 0.4)} textAnchor="middle" fontSize={fs} className="viz-text">
                    {fmt(v, 3)}
                  </text>
                )}
              </>
            )}
            {world.start[0] === x && world.start[1] === y && term === undefined && (
              <text x={X + 9} y={Y + 18} fontSize={10} className="viz-muted">
                S
              </text>
            )}
          </g>
        )
      })}
      {trail && trail.length > 1 && (
        <path
          d={trail.map(([x, y], i) => `${i ? 'L' : 'M'}${ox + x * cell + cell / 2},${oy + y * cell + cell / 2}`).join('')}
          fill="none"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ stroke: 'var(--accent)', opacity: 0.55 }}
        />
      )}
      {agent && (
        <motion.g initial={false} animate={{ x: ox + agent[0] * cell + cell / 2, y: oy + agent[1] * cell + cell / 2 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
          <circle r={cell * 0.2} strokeWidth={3} style={{ fill: 'var(--accent)', stroke: 'var(--bg)', filter: 'drop-shadow(0 0 8px var(--accent))' }} />
        </motion.g>
      )}
    </svg>
  )
}
