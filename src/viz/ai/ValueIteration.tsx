import { useMemo, useState } from 'react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt } from '../core/math'
import { GridBoard, key, move, type World } from './gridworld'

const CODE = `def value_iteration(states, actions, P, R, gamma=1.0, eps=1e-4):
    V = {s: 0.0 for s in states}
    while True:
        delta = 0.0
        for s in states:
            if is_terminal(s):
                V[s] = R(s)                          # +1 or -1
                continue
            best = max(sum(p * V[s2] for p, s2 in P(s, a))
                       for a in actions(s))         # Bellman backup
            new = R(s) + gamma * best
            delta = max(delta, abs(new - V[s]))
            V[s] = new
        if delta < eps:
            return V`

// The classic 4 × 3 world (Russell & Norvig): row 0 is the top row.
const WORLD: World = {
  W: 4,
  H: 3,
  walls: new Set([key(1, 1)]),
  terminals: new Map([
    [key(3, 0), 1],
    [key(3, 1), -1],
  ]),
  start: [0, 2],
}

// 80% intended direction, 10% each perpendicular direction.
function transitions(x: number, y: number, a: number): [number, [number, number]][] {
  return [
    [0.8, move(WORLD, x, y, a)],
    [0.1, move(WORLD, x, y, (a + 1) % 4)],
    [0.1, move(WORLD, x, y, (a + 3) % 4)],
  ]
}

// iteration order matches the Python list: x-major, then y from the bottom row up
const STATES: [number, number][] = []
for (let x = 0; x < 4; x++) for (let yUp = 0; yUp < 3; yUp++) if (!WORLD.walls.has(key(x, 2 - yUp))) STATES.push([x, 2 - yUp])

interface Frame extends StepFrame {
  sweep: number
  V: Map<string, number>
  focus?: string
  deltas: number[]
  policy: Map<string, number>
  done: boolean
}

function greedy(V: Map<string, number>) {
  const pol = new Map<string, number>()
  for (const [x, y] of STATES) {
    const k = key(x, y)
    if (WORLD.terminals.has(k)) continue
    let best = 0
    let bv = -Infinity
    for (let a = 0; a < 4; a++) {
      const q = transitions(x, y, a).reduce((s, [p, [nx, ny]]) => s + p * (V.get(key(nx, ny)) ?? 0), 0)
      if (q > bv + 1e-12) {
        bv = q
        best = a
      }
    }
    pol.set(k, best)
  }
  return pol
}

function* program(gamma: number, R: number): Generator<Frame, void, void> {
  const V = new Map<string, number>(STATES.map(([x, y]) => [key(x, y), 0]))
  const deltas: number[] = []
  yield { sweep: 0, V: new Map(V), deltas: [], policy: new Map(), done: false, line: 2, dwell: 1.8, note: `Start with V(s) = 0 everywhere. Moves are noisy: 80% as intended, 10% to each side. Every step costs ${fmt(-R, 2)}.` }
  for (let sweep = 1; sweep <= 200; sweep++) {
    let delta = 0
    for (const [x, y] of STATES) {
      const k = key(x, y)
      let nv: number
      if (WORLD.terminals.has(k)) nv = WORLD.terminals.get(k)!
      else {
        let best = -Infinity
        for (let a = 0; a < 4; a++) best = Math.max(best, transitions(x, y, a).reduce((s, [p, [nx, ny]]) => s + p * V.get(key(nx, ny))!, 0))
        nv = R + gamma * best
      }
      delta = Math.max(delta, Math.abs(nv - V.get(k)!))
      V.set(k, nv)
      if (sweep <= 2) {
        const term = WORLD.terminals.has(k)
        yield {
          sweep,
          V: new Map(V),
          focus: k,
          deltas: [...deltas],
          policy: sweep > 1 ? greedy(V) : new Map(),
          done: false,
          line: term ? [6, 7] : [9, 13],
          dwell: sweep === 1 ? 0.8 : 0.35,
          note: term ? 'Terminal states are worth their reward.' : sweep === 1 ? `Bellman backup: V(s) = R + γ·max over actions of the expected value of the next state → ${fmt(nv, 3)}.` : 'Good values spread outward from the +1 exit, one sweep at a time.',
        }
      }
    }
    deltas.push(delta)
    yield { sweep, V: new Map(V), deltas: [...deltas], policy: greedy(V), done: false, line: [4, 14], dwell: sweep <= 2 ? 1.2 : 0.7, note: `Sweep ${sweep}: largest change Δ = ${fmt(delta, 4)}. Arrows show the greedy policy for the current values.` }
    if (delta < 1e-4) {
      yield { sweep, V: new Map(V), deltas, policy: greedy(V), done: true, line: [14, 15], dwell: 6, note: `Converged after ${sweep} sweeps. Following the arrows is the optimal policy — note how it avoids walking next to the −1 square when slipping is costly.` }
      return
    }
  }
  yield { sweep: 200, V: new Map(V), deltas, policy: greedy(V), done: true, line: 3, dwell: 5, note: 'Stopped after 200 sweeps: with γ = 1 and no step cost, values change very slowly.' }
}

export default function ValueIteration() {
  const [gamma, setGamma] = useState(1)
  const [R, setR] = useState(-0.04)
  const player = usePlayer(() => program(gamma, R), [gamma, R], { interval: 650, loop: 2400 })
  const fr = player.frame
  const policy = useMemo(() => fr.policy, [fr.policy])
  return (
    <LabFrame
      title="Markov decision process · value iteration"
      status={fr.done ? `converged · ${fr.sweep} sweeps` : `sweep ${fr.sweep}`}
      player={player}
      stage={
        <Stage aspect={0.62} min={260} max={440}>
          {(box) => <GridBoard box={box} world={WORLD} values={fr.V} policy={policy} focus={fr.focus} />}
        </Stage>
      }
      legend={[
        { label: 'high value', color: 'var(--easy)', shape: 'square' },
        { label: 'low value', color: 'var(--hard)', shape: 'square' },
        { label: 'greedy policy', color: 'var(--fg)', shape: 'line' },
      ]}
      below={
        <MiniPanel title="Max change per sweep (log)" right={fr.deltas.length ? fmt(fr.deltas[fr.deltas.length - 1], 5) : undefined}>
          <Stage aspect={0.22} min={100} max={130}>
            {(box) => <Deltas box={box} deltas={fr.deltas} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'value_iteration.py',
        vars: [
          { name: 'sweep', value: String(fr.sweep) },
          { name: 'gamma', value: gamma.toFixed(2) },
          { name: 'R(s)', value: fmt(R, 2) },
          { name: 'V[start]', value: fmt(fr.V.get(key(0, 2)), 3), color: 'var(--accent)' },
          { name: 'delta', value: fr.deltas.length ? fmt(fr.deltas[fr.deltas.length - 1], 4) : '—', color: 'var(--accent-3)' },
        ],
      }}
      params={
        <>
          <Slider label="Discount γ" value={gamma} min={0.5} max={1} step={0.01} onChange={setGamma} format={(v) => v.toFixed(2)} />
          <Slider label="Living reward R(s)" value={R} min={-0.6} max={0} step={0.01} onChange={setR} format={(v) => v.toFixed(2)} />
        </>
      }
    />
  )
}

function Deltas({ box, deltas }: { box: Box; deltas: number[] }) {
  const n = Math.max(10, deltas.length)
  const F = frame2d(box, [1, n], [-4, 0.5], { l: 30, b: 18, t: 6, r: 8 })
  const pts = deltas.map((d, i) => [F.sx(i + 1), F.sy(Math.max(-4, Math.log10(Math.max(d, 1e-6))))] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={F} xTicks={6} yTicks={2} xLabel="sweep" />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
    </svg>
  )
}
