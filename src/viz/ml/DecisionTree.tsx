import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, rng } from '../core/math'
import { CLASS_COLORS, type Point } from '../core/datasets'

const CODE = `import numpy as np

def gini(y):
    p = np.bincount(y) / len(y)
    return 1 - np.sum(p ** 2)

def best_split(X, y):
    best = (None, None, gini(y))
    for f in range(X.shape[1]):
        for t in np.unique(X[:, f]):
            left, right = y[X[:, f] <= t], y[X[:, f] > t]
            if len(left) == 0 or len(right) == 0:
                continue
            g = (len(left) * gini(left) + len(right) * gini(right)) / len(y)
            if g < best[2]:
                best = (f, t, g)
    return best

def build(X, y, depth=0):
    if depth == max_depth or gini(y) == 0:
        return Leaf(np.bincount(y).argmax())
    f, t, _ = best_split(X, y)
    if f is None:
        return Leaf(np.bincount(y).argmax())
    m = X[:, f] <= t
    return Node(f, t, build(X[m], y[m], depth + 1),
                      build(X[~m], y[~m], depth + 1))`

type Region = [number, number, number, number] // x0, x1, y0, y1

interface TNode {
  id: number
  depth: number
  idx: number[]
  region: Region
  gini: number
  split?: { f: number; t: number; g: number }
  left?: TNode
  right?: TNode
  leaf?: number
  /** layout */
  lx?: number
}

type Event =
  | { kind: 'visit'; node: TNode }
  | { kind: 'scan'; node: TNode; f: number; t: number; g: number; best: { f: number; t: number; g: number } | null }
  | { kind: 'split'; node: TNode }
  | { kind: 'leaf'; node: TNode }

const giniOf = (labels: number[]) => {
  if (!labels.length) return 0
  const n1 = labels.filter((c) => c === 1).length
  const p1 = n1 / labels.length
  return 1 - p1 * p1 - (1 - p1) * (1 - p1)
}
const majority = (labels: number[]) => (labels.filter((c) => c === 1).length * 2 > labels.length ? 1 : 0)

function grow(pts: Point[], maxDepth: number) {
  const events: Event[] = []
  let nextId = 0
  const rec = (idx: number[], depth: number, region: Region): TNode => {
    const labels = idx.map((i) => pts[i].c)
    const node: TNode = { id: nextId++, depth, idx, region, gini: giniOf(labels) }
    events.push({ kind: 'visit', node })
    if (depth === maxDepth || node.gini === 0) {
      node.leaf = majority(labels)
      events.push({ kind: 'leaf', node })
      return node
    }
    let best: { f: number; t: number; g: number } | null = null
    let bestG = node.gini
    for (const f of [0, 1]) {
      const vals = [...new Set(idx.map((i) => (f === 0 ? pts[i].x : pts[i].y)))].sort((a, b) => a - b)
      const every = Math.max(1, Math.ceil(vals.length / 22))
      vals.forEach((t, k) => {
        const left = idx.filter((i) => (f === 0 ? pts[i].x : pts[i].y) <= t).map((i) => pts[i].c)
        const right = idx.filter((i) => (f === 0 ? pts[i].x : pts[i].y) > t).map((i) => pts[i].c)
        if (!left.length || !right.length) return
        const g = (left.length * giniOf(left) + right.length * giniOf(right)) / idx.length
        if (g < bestG) {
          bestG = g
          best = { f, t, g }
        }
        if (k % every === 0 || best?.t === t) events.push({ kind: 'scan', node, f, t, g, best })
      })
    }
    if (!best) {
      node.leaf = majority(labels)
      events.push({ kind: 'leaf', node })
      return node
    }
    const b = best as { f: number; t: number; g: number }
    node.split = b
    events.push({ kind: 'split', node })
    const val = (i: number) => (b.f === 0 ? pts[i].x : pts[i].y)
    const lr: Region = b.f === 0 ? [region[0], b.t, region[2], region[3]] : [region[0], region[1], region[2], b.t]
    const rr: Region = b.f === 0 ? [b.t, region[1], region[2], region[3]] : [region[0], region[1], b.t, region[3]]
    node.left = rec(idx.filter((i) => val(i) <= b.t), depth + 1, lr)
    node.right = rec(idx.filter((i) => val(i) > b.t), depth + 1, rr)
    return node
  }
  const root = rec(pts.map((_, i) => i), 0, [0, 10, 0, 10])
  // in-order layout
  let leafX = 0
  const layout = (n: TNode): number => {
    if (!n.left || !n.right) {
      n.lx = leafX++
      return n.lx
    }
    n.lx = (layout(n.left) + layout(n.right)) / 2
    return n.lx
  }
  layout(root)
  return { root, events, leaves: leafX }
}

interface Frame extends StepFrame {
  k: number
  done: Set<number>
  current?: TNode
  scan?: { f: number; t: number; g: number; best: { f: number; t: number; g: number } | null }
  curve: [number, number][]
}

function* program(events: Event[]): Generator<Frame, void, void> {
  const done = new Set<number>()
  let curve: [number, number][] = []
  let curF = -1
  let first = true
  for (let k = 0; k < events.length; k++) {
    const e = events[k]
    if (e.kind === 'visit') {
      curve = []
      curF = -1
      yield { k, done: new Set(done), current: e.node, curve, line: [19, 20], dwell: first ? 1.6 : 0.7, note: `Node with ${e.node.idx.length} points, Gini impurity ${fmt(e.node.gini, 3)}. ${e.node.gini === 0 ? 'Already pure.' : 'Search every feature and threshold for the best split.'}` }
      first = false
    } else if (e.kind === 'scan') {
      if (e.f !== curF) {
        curF = e.f
        curve = []
      }
      curve = [...curve, [e.t, e.g]]
      yield { k, done: new Set(done), current: e.node, scan: e, curve, line: e.best?.t === e.t && e.best?.f === e.f ? [14, 16] : [10, 14], dwell: 0.14, note: `Trying x${e.f === 0 ? '₁' : '₂'} ≤ ${fmt(e.t, 2)} → weighted Gini ${fmt(e.g, 3)}${e.best ? ` (best so far ${fmt(e.best.g, 3)})` : ''}.` }
    } else if (e.kind === 'split') {
      done.add(e.node.id)
      const s = e.node.split!
      yield { k, done: new Set(done), current: e.node, curve, line: [25, 27], dwell: 1.4, note: `Best split: x${s.f === 0 ? '₁' : '₂'} ≤ ${fmt(s.t, 2)} lowers impurity from ${fmt(e.node.gini, 3)} to ${fmt(s.g, 3)}. Recurse into both halves.` }
    } else {
      done.add(e.node.id)
      yield { k, done: new Set(done), current: e.node, curve: [], line: 21, dwell: 0.8, note: `Leaf → predict class ${e.node.leaf} (${e.node.gini === 0 ? 'pure' : 'max depth reached'}).` }
    }
  }
  yield { k: events.length, done, curve: [], line: [26, 27], dwell: 5, note: 'Tree complete: each leaf is an axis-aligned box that predicts its majority class.' }
}

function makeData(): Point[] {
  const r = rng(77)
  const pts: Point[] = []
  for (let i = 0; i < 70; i++) {
    const x = r.range(0.3, 9.7)
    const y = r.range(0.3, 9.7)
    let c = (x > 5.5 && y < 6.5) || (x < 3 && y > 6.2) ? 1 : 0
    if (r.next() < 0.06) c = 1 - c
    pts.push({ x, y, c })
  }
  return pts
}

export default function DecisionTree() {
  const [maxDepth, setMaxDepth] = useState(3)
  const pts = useMemo(makeData, [])
  const tree = useMemo(() => grow(pts, maxDepth), [pts, maxDepth])
  const player = usePlayer(() => program(tree.events), [tree], { interval: 640, loop: 2600 })
  const fr = player.frame
  const nodes = useMemo(() => {
    const all: TNode[] = []
    const walk = (n: TNode) => {
      all.push(n)
      if (n.left) walk(n.left)
      if (n.right) walk(n.right)
    }
    walk(tree.root)
    return all
  }, [tree])
  const visited = new Set<number>()
  for (let i = 0; i <= Math.min(fr.k, tree.events.length - 1); i++) visited.add(tree.events[i].node.id)

  return (
    <LabFrame
      title="Decision tree · growing with Gini impurity"
      status={`max_depth = ${maxDepth}`}
      player={player}
      stage={
        <Stage aspect={0.62} min={260} max={470}>
          {(box) => <Partition box={box} pts={pts} nodes={nodes} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'class 0', color: CLASS_COLORS[0] },
        { label: 'class 1', color: CLASS_COLORS[1] },
        { label: 'candidate split', color: 'var(--accent)', shape: 'dash' },
      ]}
      below={
        <div className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
          <MiniPanel title="The tree so far">
            <Stage aspect={0.42} min={150} max={220}>
              {(box) => <TreeDiagram box={box} root={tree.root} leaves={tree.leaves} maxDepth={maxDepth} visited={visited} current={fr.current?.id} />}
            </Stage>
          </MiniPanel>
          <MiniPanel title="Weighted Gini vs threshold" right={fr.scan ? `x${fr.scan.f === 0 ? '₁' : '₂'}` : undefined}>
            <Stage aspect={0.6} min={150} max={220}>
              {(box) => <GiniScan box={box} f={fr} />}
            </Stage>
          </MiniPanel>
        </div>
      }
      code={{
        source: CODE,
        file: 'decision_tree.py',
        vars: [
          { name: 'depth', value: fr.current ? String(fr.current.depth) : '—' },
          { name: 'len(y)', value: fr.current ? String(fr.current.idx.length) : '—' },
          { name: 'gini(y)', value: fmt(fr.current?.gini, 3), color: 'var(--accent-3)' },
          { name: '(f, t)', value: fr.scan ? `(${fr.scan.f}, ${fmt(fr.scan.t, 2)})` : fr.current?.split ? `(${fr.current.split.f}, ${fmt(fr.current.split.t, 2)})` : '—' },
          { name: 'g', value: fmt(fr.scan?.g ?? fr.current?.split?.g, 3), color: 'var(--accent)' },
          { name: 'best[2]', value: fmt(fr.scan?.best?.g ?? fr.current?.split?.g, 3), color: 'var(--easy)' },
        ],
      }}
      params={<Slider label="max_depth" value={maxDepth} min={1} max={4} onChange={setMaxDepth} />}
    />
  )
}

function Partition({ box, pts, nodes, f }: { box: Box; pts: Point[]; nodes: TNode[]; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const fr = frame2d(box, [0, 10], [0, 10], { l: 34, b: 26, t: 12, r: 12 })
  const { sx, sy } = fr
  const leaves = nodes.filter((n) => n.leaf !== undefined && f.done.has(n.id))
  const splits = nodes.filter((n) => n.split && f.done.has(n.id))
  const cur = f.current
  const rect = (r: Region) => ({ x: sx(r[0]), y: sy(r[3]), width: sx(r[1]) - sx(r[0]), height: sy(r[2]) - sy(r[3]) })
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Feature space partitioned by the tree">
      <defs>
        <ClipRect id={clip} f={fr} />
      </defs>
      <Axes f={fr} xLabel="x₁" yLabel="x₂" />
      <g clipPath={`url(#${clip})`}>
        {leaves.map((n) => (
          <motion.rect key={n.id} {...rect(n.region)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ fill: `color-mix(in oklab, ${CLASS_COLORS[n.leaf!]} 17%, transparent)` }} />
        ))}
        {splits.map((n) => {
          const s = n.split!
          const [x0, x1, y0, y1] = n.region
          return s.f === 0 ? (
            <motion.line key={`s${n.id}`} x1={sx(s.t)} x2={sx(s.t)} y1={sy(y0)} y2={sy(y1)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} strokeWidth={2} style={{ stroke: 'var(--fg)' }} />
          ) : (
            <motion.line key={`s${n.id}`} x1={sx(x0)} x2={sx(x1)} y1={sy(s.t)} y2={sy(s.t)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} strokeWidth={2} style={{ stroke: 'var(--fg)' }} />
          )
        })}
        {cur && (
          <motion.rect
            initial={false}
            animate={rect(cur.region)}
            transition={{ type: 'spring', stiffness: 160, damping: 22 }}
            fill="none"
            strokeWidth={2}
            strokeDasharray="6 5"
            style={{ stroke: 'var(--accent)' }}
          />
        )}
        {f.scan && cur && (
          <line
            x1={f.scan.f === 0 ? sx(f.scan.t) : sx(cur.region[0])}
            x2={f.scan.f === 0 ? sx(f.scan.t) : sx(cur.region[1])}
            y1={f.scan.f === 0 ? sy(cur.region[2]) : sy(f.scan.t)}
            y2={f.scan.f === 0 ? sy(cur.region[3]) : sy(f.scan.t)}
            strokeWidth={2}
            strokeDasharray="5 4"
            style={{ stroke: 'var(--accent)' }}
          />
        )}
      </g>
      {pts.map((p, i) => {
        const inCur = cur?.idx.includes(i)
        return <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4.4} strokeWidth={1.3} style={{ fill: CLASS_COLORS[p.c], stroke: 'var(--bg)', opacity: !cur || inCur ? 1 : 0.35, transition: 'opacity 0.3s' }} />
      })}
    </svg>
  )
}

function TreeDiagram({ box, root, leaves, maxDepth, visited, current }: { box: Box; root: TNode; leaves: number; maxDepth: number; visited: Set<number>; current?: number }) {
  const px = (lx: number) => 30 + ((box.width - 60) * (leaves <= 1 ? 0.5 : lx / (leaves - 1)))
  const py = (d: number) => 18 + ((box.height - 40) * d) / Math.max(1, maxDepth)
  const items: { n: TNode; parent?: TNode }[] = []
  const walk = (n: TNode, parent?: TNode) => {
    items.push({ n, parent })
    if (n.left) walk(n.left, n)
    if (n.right) walk(n.right, n)
  }
  walk(root)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      {items.map(({ n, parent }) =>
        parent && visited.has(n.id) ? (
          <motion.path
            key={`e${n.id}`}
            d={`M${px(parent.lx!)},${py(parent.depth) + 9} C${px(parent.lx!)},${py(parent.depth) + 26} ${px(n.lx!)},${py(n.depth) - 26} ${px(n.lx!)},${py(n.depth) - 9}`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            fill="none"
            strokeWidth={1.4}
            style={{ stroke: 'var(--border-strong)' }}
          />
        ) : null,
      )}
      {items.map(({ n }) =>
        visited.has(n.id) ? (
          <motion.g key={n.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: `${px(n.lx!)}px ${py(n.depth)}px` }}>
            {n.id === current && <circle cx={px(n.lx!)} cy={py(n.depth)} r={15} style={{ fill: 'color-mix(in oklab, var(--accent) 25%, transparent)' }} />}
            <circle
              cx={px(n.lx!)}
              cy={py(n.depth)}
              r={9}
              strokeWidth={1.5}
              style={{ fill: n.leaf !== undefined ? CLASS_COLORS[n.leaf] : 'var(--bg-elev)', stroke: n.id === current ? 'var(--accent)' : 'var(--border-strong)' }}
            />
            <text x={px(n.lx!)} y={py(n.depth) + (n.leaf !== undefined ? 23 : -14)} textAnchor="middle" fontSize={9.5} className="viz-muted">
              {n.split ? `x${n.split.f === 0 ? '₁' : '₂'}≤${n.split.t.toFixed(1)}` : n.leaf !== undefined ? n.idx.length : ''}
            </text>
          </motion.g>
        ) : null,
      )}
    </svg>
  )
}

function GiniScan({ box, f }: { box: Box; f: Frame }) {
  const fr = frame2d(box, [0, 10], [0, 0.55], { l: 32, b: 20, t: 8, r: 8 })
  const pts = f.curve.map(([t, g]) => [fr.sx(t), fr.sy(g)] as [number, number])
  const best = f.scan?.best && f.scan.best.f === f.scan.f ? f.scan.best : null
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={5} yTicks={3} xLabel="threshold" digits={1} />
      {f.current && <line x1={fr.left} x2={fr.right} y1={fr.sy(f.current.gini)} y2={fr.sy(f.current.gini)} strokeDasharray="4 4" style={{ stroke: 'var(--fg-subtle)' }} />}
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent)' }} />
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} style={{ fill: 'var(--accent)' }} />}
      {best && <circle cx={fr.sx(best.t)} cy={fr.sy(best.g)} r={5} fill="none" strokeWidth={2} style={{ stroke: 'var(--easy)' }} />}
    </svg>
  )
}
