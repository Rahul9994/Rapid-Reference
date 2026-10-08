import { useId, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Pills } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, Stage, curve, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, rng } from '../core/math'

type Mode = 'hill' | 'restart' | 'anneal'

const HILL = `import random

def hill_climb(f, x, step=0.2):
    while True:
        best = max([x - step, x + step], key=f)
        if f(best) <= f(x):
            return x                       # local maximum: stuck
        x = best                           # move uphill

# random restarts: keep the best of several climbs
best = max((hill_climb(f, random.uniform(0, 10))
            for _ in range(5)), key=f)`

const ANNEAL = `import math, random

x = random.uniform(0, 10)
T = 2.0                                    # temperature
while T > 0.01:
    nxt = x + random.uniform(-0.6, 0.6)    # random neighbour
    nxt = min(max(nxt, 0), 10)
    delta = f(nxt) - f(x)
    if delta > 0 or random.random() < math.exp(delta / T):
        x = nxt                            # accept (even downhill!)
    T *= 0.97                              # cool down`

const g = (x: number, m: number, s: number, h: number) => h * Math.exp(-((x - m) ** 2) / (2 * s * s))
const f = (x: number) => g(x, 1.6, 0.6, 0.52) + g(x, 4.4, 0.55, 0.66) + g(x, 6.4, 0.35, 0.38) + g(x, 8.3, 0.5, 1) + 0.05

interface Frame extends StepFrame {
  x: number
  trail: number[]
  best: number
  T?: number
  temps: number[]
  values: number[]
  accepted?: 'up' | 'down' | 'rejected'
  restart: number
  done: boolean
}

function* program(mode: Mode, seed: number): Generator<Frame, void, void> {
  const r = rng(seed)
  const values: number[] = []
  if (mode !== 'anneal') {
    const starts = mode === 'hill' ? [r.range(0.3, 3.2)] : [r.range(0.3, 3.2), r.range(3.4, 5.6), r.range(0, 10), r.range(5.8, 7), r.range(7.4, 9.8)]
    let best = starts[0]
    for (let k = 0; k < starts.length; k++) {
      let x = Math.round(starts[k] * 5) / 5
      const trail = [x]
      values.push(f(x))
      yield { x, trail: [...trail], best, temps: [], values: [...values], restart: k, done: false, line: mode === 'hill' ? 3 : [11, 12], dwell: 1.3, note: k === 0 ? 'Start at a random point on the landscape.' : `Random restart #${k + 1}: drop the climber somewhere new.` }
      for (;;) {
        const cands = [x - 0.2, x + 0.2].filter((v) => v >= 0 && v <= 10)
        const nb = cands.reduce((a, b) => (f(b) > f(a) ? b : a))
        if (f(nb) <= f(x)) {
          if (f(x) > f(best)) best = x
          yield { x, trail: [...trail], best, temps: [], values: [...values], restart: k, done: false, line: [6, 7], dwell: 1.8, note: `No neighbour is higher: stuck on a peak of height ${fmt(f(x), 2)}${f(x) < 0.99 ? ' — a local maximum, not the global one.' : ' — the global maximum!'}` }
          break
        }
        x = Math.round(nb * 100) / 100
        trail.push(x)
        values.push(f(x))
        yield { x, trail: [...trail], best, temps: [], values: [...values], restart: k, done: false, line: [5, 8], dwell: 0.32, note: 'Look at both neighbours and step to the higher one.' }
      }
    }
    yield { x: best, trail: [best], best, temps: [], values, restart: starts.length - 1, done: true, line: mode === 'hill' ? 7 : [11, 12], dwell: 5, note: mode === 'hill' ? 'Plain hill climbing returns whatever peak is nearest its start.' : `Best of ${starts.length} climbs: height ${fmt(f(best), 2)}. Restarts make finding the global peak much more likely.` }
    return
  }
  let x = r.range(0.3, 2.5)
  let T = 2
  let best = x
  const trail = [x]
  const temps: number[] = []
  yield { x, trail: [...trail], best, T, temps: [], values: [f(x)], restart: 0, done: false, line: [3, 4], dwell: 1.5, note: 'Simulated annealing starts hot: it will happily accept bad moves at first.' }
  let it = 0
  while (T > 0.01) {
    const nxt = Math.min(10, Math.max(0, x + r.range(-0.6, 0.6)))
    const delta = f(nxt) - f(x)
    let acc: Frame['accepted'] = 'rejected'
    if (delta > 0) acc = 'up'
    else if (r.next() < Math.exp(delta / T)) acc = 'down'
    if (acc !== 'rejected') x = nxt
    if (f(x) > f(best)) best = x
    trail.push(x)
    temps.push(T)
    values.push(f(x))
    const narrate = it < 4 || (acc === 'down' && it < 40 && it % 6 === 0)
    yield {
      x,
      trail: trail.slice(-60),
      best,
      T,
      temps: [...temps],
      values: [...values],
      accepted: acc,
      restart: 0,
      done: false,
      line: acc === 'rejected' ? [6, 9] : [9, 10],
      dwell: narrate ? 1.2 : 0.12,
      note: narrate
        ? acc === 'down'
          ? `Downhill move accepted with probability e^(Δ/T) = ${fmt(Math.exp(delta / T), 2)} — this is how it escapes local peaks.`
          : acc === 'up'
            ? 'Uphill moves are always accepted.'
            : 'A downhill move was rejected this time.'
        : `T = ${fmt(T, 3)}: ${T > 0.5 ? 'hot — wandering freely.' : T > 0.08 ? 'cooling — downhill moves get rarer.' : 'cold — behaves like hill climbing.'}`,
    }
    T *= 0.97
    it++
  }
  yield { x, trail: trail.slice(-60), best, T, temps, values, restart: 0, done: true, line: 11, dwell: 5, note: f(x) > 0.99 ? `Frozen on the global maximum (height ${fmt(f(x), 2)}). Early randomness let it hop out of the smaller peaks.` : `Frozen at height ${fmt(f(x), 2)} — a local peak this run. Cooling more slowly makes reaching the global maximum more likely.` }
}

export default function HillClimbing() {
  const [mode, setMode] = useState<Mode>('hill')
  const [seed, setSeed] = useState(2)
  const player = usePlayer(() => program(mode, seed), [mode, seed], { interval: 600, loop: 2000 })
  const fr = player.frame
  return (
    <LabFrame
      title={mode === 'anneal' ? 'Simulated annealing' : mode === 'restart' ? 'Hill climbing with random restarts' : 'Hill climbing'}
      status={mode === 'anneal' ? `T = ${fmt(fr.T, 3)}` : `climb ${fr.restart + 1}`}
      player={player}
      stage={
        <Stage aspect={0.5} min={240} max={400}>
          {(box) => <Landscape box={box} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'objective f(x)', color: 'var(--accent)', shape: 'line' },
        { label: 'climber', color: 'var(--accent-3)' },
        { label: 'best so far', color: 'var(--easy)', shape: 'ring' },
      ]}
      below={
        <MiniPanel title={mode === 'anneal' ? 'f(x) and temperature over time' : 'f(x) over steps'}>
          <Stage aspect={0.2} min={100} max={130}>
            {(box) => <History box={box} f={fr} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: mode === 'anneal' ? ANNEAL : HILL,
        file: mode === 'anneal' ? 'simulated_annealing.py' : 'hill_climbing.py',
        vars: [
          { name: 'x', value: fmt(fr.x, 2), color: 'var(--accent-3)' },
          { name: 'f(x)', value: fmt(f(fr.x), 3), color: 'var(--accent)' },
          { name: 'best', value: fmt(f(fr.best), 3), color: 'var(--easy)' },
          ...(mode === 'anneal' ? [{ name: 'T', value: fmt(fr.T, 3) }, { name: 'last move', value: fr.accepted ?? '—' }] : []),
        ],
      }}
      params={
        <>
          <Pills
            label="Strategy"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'hill', label: 'Hill climbing' },
              { value: 'restart', label: 'Random restarts' },
              { value: 'anneal', label: 'Simulated annealing' },
            ]}
          />
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg">
            New start
          </button>
        </>
      }
    />
  )
}

function Landscape({ box, f: fr }: { box: Box; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const F = frame2d(box, [0, 10], [0, 1.25], { l: 30, b: 26, t: 14, r: 12 })
  const { sx, sy } = F
  const d = curve(F, f, 240)
  const area = `${d}L${sx(10)},${sy(0)}L${sx(0)},${sy(0)}Z`
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Objective landscape with a climbing search">
      <defs>
        <ClipRect id={clip} f={F} />
        <linearGradient id={`${clip}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.32 }} />
          <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <Axes f={F} xTicks={10} yTicks={4} xLabel="state x" yLabel="f(x)" digits={1} />
      <path d={area} style={{ fill: `url(#${clip}-g)` }} />
      <path d={d} fill="none" strokeWidth={2.5} style={{ stroke: 'var(--accent)' }} />
      <text x={sx(8.3)} y={sy(f(8.3)) - 14} textAnchor="middle" className="viz-muted" fontSize={10.5}>
        global max
      </text>
      <path d={pathOf(fr.trail.map((x) => [sx(x), sy(f(x))]))} fill="none" strokeWidth={1.4} strokeDasharray="3 4" style={{ stroke: 'var(--accent-3)', opacity: 0.6 }} clipPath={`url(#${clip})`} />
      <g transform={`translate(${sx(fr.best)} ${sy(f(fr.best))})`}>
        <circle r={10} fill="none" strokeWidth={2} style={{ stroke: 'var(--easy)' }} />
      </g>
      <motion.g initial={false} animate={{ x: sx(fr.x), y: sy(f(fr.x)) }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
        <circle r={8} strokeWidth={2.5} style={{ fill: 'var(--accent-3)', stroke: 'var(--bg)', filter: 'drop-shadow(0 0 6px var(--accent-3))' }} />
        {fr.accepted === 'down' && (
          <text y={-14} textAnchor="middle" fontSize={11} style={{ fill: 'var(--medium)' }}>
            ↓ accepted
          </text>
        )}
      </motion.g>
      {fr.T !== undefined && (
        <g transform={`translate(${F.right - 120} ${F.top + 4})`}>
          <text x={0} y={10} className="viz-label">
            temperature
          </text>
          <rect x={0} y={16} width={110} height={6} rx={3} style={{ fill: 'color-mix(in oklab, var(--fg) 10%, transparent)' }} />
          <rect x={0} y={16} width={Math.max(2, (fr.T / 2) * 110)} height={6} rx={3} style={{ fill: 'var(--hard)' }} />
        </g>
      )}
    </svg>
  )
}

function History({ box, f: fr }: { box: Box; f: Frame }) {
  const n = Math.max(20, fr.values.length)
  const F = frame2d(box, [0, n], [0, 1.1], { l: 30, b: 18, t: 6, r: 8 })
  const pv = fr.values.map((v, i) => [F.sx(i), F.sy(v)] as [number, number])
  const pt = fr.temps.map((t, i) => [F.sx(i + 1), F.sy((t / 2) * 1.1)] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={F} xTicks={6} yTicks={2} xLabel="step" digits={1} />
      {pt.length > 0 && <path d={pathOf(pt)} fill="none" strokeWidth={1.5} strokeDasharray="4 4" style={{ stroke: 'var(--hard)' }} />}
      <path d={pathOf(pv)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent)' }} />
    </svg>
  )
}
