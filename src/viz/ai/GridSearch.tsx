import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Pills } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'
import { rng } from '../core/math'

type Algo = 'bfs' | 'dfs' | 'ucs' | 'greedy' | 'astar'

const CODES: Record<Algo, { file: string; code: string; lines: { init: number[]; pop: number[]; goal: number[]; expand: number[]; push: number[]; done: number[] } }> = {
  bfs: {
    file: 'bfs.py',
    code: `from collections import deque

def bfs(grid, start, goal):
    frontier = deque([start])           # FIFO queue
    parent = {start: None}
    while frontier:
        node = frontier.popleft()       # oldest first
        if node == goal:
            return path(parent, goal)
        for nb in neighbours(grid, node):
            if nb not in parent:
                parent[nb] = node
                frontier.append(nb)
    return None`,
    lines: { init: [4, 5], pop: [7], goal: [8, 9], expand: [10], push: [11, 13], done: [9] },
  },
  dfs: {
    file: 'dfs.py',
    code: `def dfs(grid, start, goal):
    frontier = [start]                  # LIFO stack
    parent = {start: None}
    while frontier:
        node = frontier.pop()           # newest first
        if node == goal:
            return path(parent, goal)
        for nb in neighbours(grid, node):
            if nb not in parent:
                parent[nb] = node
                frontier.append(nb)
    return None`,
    lines: { init: [2, 3], pop: [5], goal: [6, 7], expand: [8], push: [9, 11], done: [7] },
  },
  ucs: {
    file: 'uniform_cost.py',
    code: `import heapq

def ucs(grid, start, goal):             # = Dijkstra
    frontier = [(0, start)]             # priority = path cost g
    g = {start: 0}
    parent = {start: None}
    while frontier:
        cost, node = heapq.heappop(frontier)
        if cost > g[node]:
            continue                    # stale entry, already improved
        if node == goal:
            return path(parent, goal)
        for nb in neighbours(grid, node):
            new = cost + step_cost(grid, nb)   # mud costs 5
            if new < g.get(nb, float("inf")):
                g[nb] = new
                parent[nb] = node
                heapq.heappush(frontier, (new, nb))
    return None`,
    lines: { init: [4, 6], pop: [8, 10], goal: [11, 12], expand: [13, 14], push: [15, 18], done: [12] },
  },
  greedy: {
    file: 'greedy_best_first.py',
    code: `import heapq

def greedy(grid, start, goal):
    h = lambda n: manhattan(n, goal)    # heuristic only
    frontier = [(h(start), start)]
    parent = {start: None}
    while frontier:
        _, node = heapq.heappop(frontier)
        if node == goal:
            return path(parent, goal)
        for nb in neighbours(grid, node):
            if nb not in parent:
                parent[nb] = node
                heapq.heappush(frontier, (h(nb), nb))
    return None`,
    lines: { init: [4, 6], pop: [8], goal: [9, 10], expand: [11], push: [12, 14], done: [10] },
  },
  astar: {
    file: 'a_star.py',
    code: `import heapq

def a_star(grid, start, goal):
    h = lambda n: manhattan(n, goal)    # admissible heuristic
    frontier = [(h(start), 0, start)]   # priority f = g + h
    g = {start: 0}
    parent = {start: None}
    while frontier:
        f, cost, node = heapq.heappop(frontier)
        if cost > g[node]:
            continue                    # stale entry
        if node == goal:
            return path(parent, goal)
        for nb in neighbours(grid, node):
            new = cost + step_cost(grid, nb)
            if new < g.get(nb, float("inf")):
                g[nb] = new
                parent[nb] = node
                heapq.heappush(frontier, (new + h(nb), new, nb))
    return None`,
    lines: { init: [4, 7], pop: [9, 11], goal: [12, 13], expand: [14, 15], push: [16, 19], done: [13] },
  },
}

const LABEL: Record<Algo, string> = { bfs: 'BFS', dfs: 'DFS', ucs: 'Uniform-cost', greedy: 'Greedy best-first', astar: 'A*' }
const NOTE: Record<Algo, string> = {
  bfs: 'BFS explores in rings of equal depth — guaranteed shortest path in steps, but it ignores costs (mud).',
  dfs: 'DFS dives down one branch as far as it can. Low memory, but the path it finds can be long and winding.',
  ucs: 'Uniform-cost search always expands the cheapest frontier node, so it routes around expensive mud.',
  greedy: 'Greedy best-first rushes toward the goal using only the heuristic h — fast, but not guaranteed optimal.',
  astar: 'A* expands by f = g + h: cost so far plus an optimistic estimate. Optimal with an admissible h, and it explores far less than UCS.',
}

const COLS = 22
const ROWS = 13
type Cell = 0 | 1 | 2 // free, wall, mud

interface Frame extends StepFrame {
  explored: number[]
  frontier: number[]
  current: number
  path: number[]
  cost: number
  done: boolean
}

function makeGrid(seed: number): Cell[] {
  const r = rng(seed)
  const g: Cell[] = new Array(COLS * ROWS).fill(0)
  // a few wall segments
  const walls: [number, number, number, number][] = [
    [6, 1, 6, 8],
    [11, 4, 11, 12],
    [15, 0, 15, 7],
    [2, 9, 8, 9],
  ]
  for (const [x0, y0, x1, y1] of walls) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) g[y * COLS + x] = 1
  // gaps
  g[4 * COLS + 6] = 0
  g[10 * COLS + 11] = 0
  // mud patch
  for (let x = 16; x <= 20; x++) for (let y = 8; y <= 11; y++) if (r.next() < 0.9) g[y * COLS + x] = 2
  for (let x = 7; x <= 10; x++) for (let y = 1; y <= 3; y++) g[y * COLS + x] = 2
  return g
}

const START = 1 * COLS + 1
const GOAL = 11 * COLS + 20

function* search(grid: Cell[], algo: Algo): Generator<Frame, void, void> {
  const L = CODES[algo].lines
  const nbrs = (i: number) => {
    const x = i % COLS
    const y = Math.floor(i / COLS)
    const out: number[] = []
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue
      const j = ny * COLS + nx
      if (grid[j] !== 1) out.push(j)
    }
    return out
  }
  const h = (i: number) => Math.abs((i % COLS) - (GOAL % COLS)) + Math.abs(Math.floor(i / COLS) - Math.floor(GOAL / COLS))
  const stepCost = (j: number) => (grid[j] === 2 ? 5 : 1)
  const parent = new Map<number, number>([[START, -1]])
  const g = new Map<number, number>([[START, 0]])
  const explored: number[] = []
  // frontier as array of [priority, tie, node]
  let tie = 0
  const frontier: [number, number, number][] = [[algo === 'greedy' || algo === 'astar' ? h(START) : 0, tie++, START]]
  const popNode = (): number => {
    if (algo === 'bfs') return frontier.shift()![2]
    if (algo === 'dfs') return frontier.pop()![2]
    let bi = 0
    for (let k = 1; k < frontier.length; k++) {
      const a = frontier[k]
      const b = frontier[bi]
      if (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) bi = k
    }
    return frontier.splice(bi, 1)[0][2]
  }
  const closed = new Set<number>()
  const snap = (current: number, line: number[], note: string, dwell: number, path: number[] = [], done = false): Frame => ({
    explored: [...explored],
    frontier: frontier.map((f) => f[2]),
    current,
    path,
    cost: path.length ? path.slice(1).reduce((s, j) => s + stepCost(j), 0) : 0,
    done,
    line,
    note,
    dwell,
  })
  yield snap(START, L.init, 'Start: the frontier holds only the start cell.', 1.4)
  let steps = 0
  while (frontier.length) {
    const node = popNode()
    if ((algo === 'ucs' || algo === 'astar' || algo === 'greedy') && closed.has(node)) continue
    closed.add(node)
    explored.push(node)
    const slow = steps < 3
    steps++
    if (node === GOAL) {
      const path: number[] = []
      let c = GOAL
      while (c !== -1) {
        path.unshift(c)
        c = parent.get(c)!
      }
      yield snap(node, L.done, `Goal reached after expanding ${explored.length} cells. Path length ${path.length - 1} steps, cost ${path.slice(1).reduce((s, j) => s + stepCost(j), 0)}.`, 6, path, true)
      return
    }
    yield snap(node, L.pop, slow ? `Pop the next cell from the frontier (${algo === 'bfs' ? 'oldest' : algo === 'dfs' ? 'newest' : 'lowest priority'}).` : NOTE[algo], slow ? 1.1 : 0.18)
    for (const nb of nbrs(node)) {
      if (algo === 'ucs' || algo === 'astar') {
        const nc = g.get(node)! + stepCost(nb)
        if (nc < (g.get(nb) ?? Infinity)) {
          g.set(nb, nc)
          parent.set(nb, node)
          frontier.push([algo === 'astar' ? nc + h(nb) : nc, tie++, nb])
        }
      } else if (!parent.has(nb)) {
        parent.set(nb, node)
        frontier.push([algo === 'greedy' ? h(nb) : 0, tie++, nb])
      }
    }
    yield snap(node, L.push, slow ? 'Add its unvisited neighbours to the frontier (outlined cells).' : NOTE[algo], slow ? 1.1 : 0.18)
  }
  yield snap(-1, L.done, 'Frontier empty — no path exists.', 4, [], true)
}

export default function GridSearch({ algos, initial }: { algos: Algo[]; initial: Algo }) {
  const [algo, setAlgo] = useState<Algo>(initial)
  const [grid, setGrid] = useState<Cell[]>(() => makeGrid(4))
  const [version, setVersion] = useState(0)
  const player = usePlayer(() => search(grid, algo), [algo, version], { interval: 600, loop: 2200 })
  const fr = player.frame
  const spec = CODES[algo]

  const toggle = (i: number) => {
    if (i === START || i === GOAL) return
    setGrid((g) => {
      const n = [...g]
      n[i] = n[i] === 1 ? 0 : 1
      return n
    })
    setVersion((v) => v + 1)
  }

  return (
    <LabFrame
      title={`${LABEL[algo]} · grid path-finding`}
      status={fr.done ? (fr.path.length ? `found · cost ${fr.cost}` : 'no path') : `expanded ${fr.explored.length}`}
      player={player}
      stage={
        <Stage aspect={ROWS / COLS} min={240} max={480}>
          {(box) => <Board box={box} grid={grid} f={fr} onToggle={toggle} />}
        </Stage>
      }
      legend={[
        { label: 'start', color: 'var(--accent)', shape: 'square' },
        { label: 'goal', color: 'var(--accent-3)', shape: 'square' },
        { label: 'explored', color: 'var(--accent-2)', shape: 'square' },
        { label: 'frontier', color: 'var(--accent-2)', shape: 'ring' },
        { label: 'mud (cost 5)', color: 'var(--medium)', shape: 'square' },
        { label: 'click cells to toggle walls', color: 'var(--fg-subtle)', shape: 'square' },
      ]}
      code={{
        source: spec.code,
        file: spec.file,
        vars: [
          { name: 'expanded', value: String(fr.explored.length), color: 'var(--accent-2)' },
          { name: 'len(frontier)', value: String(fr.frontier.length) },
          { name: 'node', value: fr.current >= 0 ? `(${fr.current % COLS}, ${Math.floor(fr.current / COLS)})` : '—' },
          { name: 'path cost', value: fr.done && fr.path.length ? String(fr.cost) : '—', color: 'var(--accent)' },
        ],
      }}
      params={
        <>
          <Pills label="Algorithm" value={algo} onChange={setAlgo} options={algos.map((a) => ({ value: a, label: LABEL[a] }))} />
          <button
            type="button"
            onClick={() => {
              setGrid(makeGrid(4))
              setVersion((v) => v + 1)
            }}
            className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            Reset walls
          </button>
        </>
      }
    />
  )
}

function Board({ box, grid, f, onToggle }: { box: Box; grid: Cell[]; f: Frame; onToggle: (i: number) => void }) {
  const ref = useRef<SVGSVGElement>(null)
  const cell = Math.min((box.width - 16) / COLS, (box.height - 16) / ROWS)
  const ox = (box.width - cell * COLS) / 2
  const oy = (box.height - cell * ROWS) / 2
  const order = useMemo(() => new Map(f.explored.map((c, k) => [c, k])), [f.explored])
  const frontier = useMemo(() => new Set(f.frontier), [f.frontier])
  const total = Math.max(1, f.explored.length)
  const cx = (i: number) => ox + (i % COLS) * cell + cell / 2
  const cy = (i: number) => oy + Math.floor(i / COLS) * cell + cell / 2
  const pathD = f.path.length ? f.path.map((c, k) => `${k ? 'L' : 'M'}${cx(c)},${cy(c)}`).join('') : ''
  const onDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const rect = ref.current!.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left - ox) / cell)
    const y = Math.floor((e.clientY - rect.top - oy) / cell)
    if (x >= 0 && y >= 0 && x < COLS && y < ROWS) onToggle(y * COLS + x)
  }
  return (
    <svg ref={ref} width={box.width} height={box.height} className="absolute inset-0 cursor-pointer" onPointerDown={onDown} role="img" aria-label="Grid search animation">
      {grid.map((c, i) => {
        const k = order.get(i)
        const explored = k !== undefined
        const fill =
          c === 1
            ? 'color-mix(in oklab, var(--fg) 62%, transparent)'
            : explored
              ? `color-mix(in oklab, var(--accent-2) ${Math.round(18 + (k! / total) * 40)}%, ${c === 2 ? 'color-mix(in oklab, var(--medium) 40%, transparent)' : 'transparent'})`
              : c === 2
                ? 'color-mix(in oklab, var(--medium) 26%, transparent)'
                : 'color-mix(in oklab, var(--fg) 4%, transparent)'
        return (
          <rect
            key={i}
            x={ox + (i % COLS) * cell + 1}
            y={oy + Math.floor(i / COLS) * cell + 1}
            width={cell - 2}
            height={cell - 2}
            rx={Math.min(5, cell * 0.2)}
            style={{ fill, stroke: frontier.has(i) ? 'var(--accent-2)' : 'none', strokeWidth: 1.5, transition: 'fill 0.3s' }}
          />
        )
      })}
      {pathD && (
        <motion.path key={pathD} d={pathD} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} fill="none" strokeWidth={Math.max(3, cell * 0.22)} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 6px var(--accent))' }} />
      )}
      {f.current >= 0 && !f.done && <motion.rect initial={false} animate={{ x: ox + (f.current % COLS) * cell, y: oy + Math.floor(f.current / COLS) * cell }} transition={{ duration: 0.15 }} width={cell} height={cell} rx={Math.min(6, cell * 0.25)} fill="none" strokeWidth={2.5} style={{ stroke: 'var(--fg)' }} />}
      {[
        [START, 'var(--accent)', 'S'],
        [GOAL, 'var(--accent-3)', 'G'],
      ].map(([i, col, t]) => (
        <g key={t as string}>
          <rect x={ox + ((i as number) % COLS) * cell + 1} y={oy + Math.floor((i as number) / COLS) * cell + 1} width={cell - 2} height={cell - 2} rx={Math.min(5, cell * 0.2)} style={{ fill: col as string }} />
          <text x={cx(i as number)} y={cy(i as number) + cell * 0.16} textAnchor="middle" fontSize={cell * 0.48} fontWeight={700} style={{ fill: 'var(--bg)' }}>
            {t as string}
          </text>
        </g>
      ))}
    </svg>
  )
}
