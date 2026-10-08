import { useState } from 'react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, rng } from '../core/math'
import { ARROWS, GridBoard, key, move, type World } from './gridworld'

const CODE = `import random
from collections import defaultdict

Q = defaultdict(lambda: [0.0] * 4)                  # Q[state][action]
for episode in range(300):
    s = start
    for t in range(100):                            # cap episode length
        if random.random() < epsilon:
            a = random.randrange(4)                 # explore
        else:
            a = max(range(4), key=lambda a: Q[s][a])    # exploit
        s2, r = env.step(s, a)
        target = r + gamma * max(Q[s2]) * (not is_terminal(s2))
        Q[s][a] += alpha * (target - Q[s][a])       # TD update
        s = s2
        if is_terminal(s):
            break`

const WORLD: World = {
  W: 6,
  H: 4,
  walls: new Set([key(3, 0), key(1, 1), key(1, 2), key(3, 2)]),
  terminals: new Map([
    [key(5, 0), 1],
    [key(5, 1), -1],
    [key(2, 2), -1],
  ]),
  start: [0, 3],
}
const STEP_REWARD = -0.04
const EPISODES = 300
const ALPHA = 0.5
const GAMMA = 0.95

interface Frame extends StepFrame {
  episode: number
  Q: Map<string, number[]>
  agent: [number, number]
  trail: [number, number][]
  returns: number[]
  explore?: boolean
  done: boolean
}

function* program(epsilon: number, seed: number): Generator<Frame, void, void> {
  const r = rng(seed)
  const Q = new Map<string, number[]>()
  const getQ = (k: string) => {
    let v = Q.get(k)
    if (!v) {
      v = [0, 0, 0, 0]
      Q.set(k, v)
    }
    return v
  }
  const returns: number[] = []
  const cloneQ = () => new Map([...Q].map(([k, v]) => [k, [...v]]))
  yield { episode: 0, Q: cloneQ(), agent: WORLD.start, trail: [WORLD.start], returns: [], done: false, line: 4, dwell: 1.8, note: 'The agent knows nothing: every Q-value (one triangle per action in each cell) starts at 0. It must learn from rewards alone.' }
  for (let ep = 0; ep < EPISODES; ep++) {
    let [x, y] = WORLD.start
    const trail: [number, number][] = [[x, y]]
    let G = 0
    const watch = ep < 3 || ep === 20 || ep === 60 || ep === EPISODES - 1
    for (let t = 0; t < 100; t++) {
      const s = key(x, y)
      const qs = getQ(s)
      const explore = r.next() < epsilon
      let a: number
      if (explore) a = r.int(0, 3)
      else {
        a = 0
        for (let k = 1; k < 4; k++) if (qs[k] > qs[a]) a = k
      }
      const [nx, ny] = move(WORLD, x, y, a)
      const s2 = key(nx, ny)
      const term = WORLD.terminals.get(s2)
      const reward = term ?? STEP_REWARD
      const next = term !== undefined ? 0 : Math.max(...getQ(s2))
      const target = reward + GAMMA * next
      qs[a] += ALPHA * (target - qs[a])
      G += reward
      x = nx
      y = ny
      trail.push([x, y])
      if (watch) {
        yield {
          episode: ep,
          Q: cloneQ(),
          agent: [x, y],
          trail: [...trail],
          returns: [...returns],
          explore,
          done: false,
          line: explore ? [8, 9] : [10, 11],
          dwell: ep === 0 ? (t < 6 ? 0.9 : 0.25) : 0.22,
          note:
            ep === 0 && t < 6
              ? explore
                ? `Explore: random action ${ARROWS[a]} (probability ε).`
                : `Exploit: take the best-known action ${ARROWS[a]}${qs.every((v) => v === qs[0]) ? ' (all equal so far)' : ''}.`
              : term !== undefined
                ? `Reached a terminal square: reward ${term > 0 ? '+1' : '−1'}. The update pulls that value back into the previous state.`
                : `Episode ${ep + 1}: Q[s][a] += α·(r + γ·max Q[s′] − Q[s][a])`,
        }
        if (ep === 0 && t < 3) yield { episode: ep, Q: cloneQ(), agent: [x, y], trail: [...trail], returns: [...returns], done: false, line: [12, 14], dwell: 1, note: 'Temporal-difference update: nudge Q toward the reward plus the discounted best value of the next state.' }
      }
      if (term !== undefined) break
    }
    returns.push(G)
    if (!watch && ep % 4 === 0) {
      yield { episode: ep, Q: cloneQ(), agent: [x, y], trail, returns: [...returns], done: false, line: [5, 6], dwell: 0.35, note: `Episode ${ep + 1}: return ${fmt(G, 2)}. Value is spreading back from the +1 goal.` }
    }
  }
  yield { episode: EPISODES, Q: cloneQ(), agent: WORLD.start, trail: [WORLD.start], returns, done: true, line: 5, dwell: 6, note: `After ${EPISODES} episodes the arrows (greedy action per cell) form a safe route to +1 around the pits. Q-learning learned it without ever being given the map's rules.` }
}

export default function QLearning() {
  const [epsilon, setEpsilon] = useState(0.2)
  const [seed, setSeed] = useState(5)
  const player = usePlayer(() => program(epsilon, seed), [epsilon, seed], { interval: 600, loop: 2400 })
  const fr = player.frame
  const policy = new Map<string, number>()
  for (const [k, qs] of fr.Q) {
    if (WORLD.terminals.has(k) || qs.every((v) => v === 0)) continue
    let a = 0
    for (let i = 1; i < 4; i++) if (qs[i] > qs[a]) a = i
    policy.set(k, a)
  }
  return (
    <LabFrame
      title="Reinforcement learning · Q-learning"
      status={fr.done ? 'trained' : `episode ${fr.episode + 1}/${EPISODES}`}
      player={player}
      stage={
        <Stage aspect={0.66} min={260} max={460}>
          {(box) => <GridBoard box={box} world={WORLD} q={fr.Q} policy={policy} agent={fr.agent} trail={fr.trail} showNumbers={false} />}
        </Stage>
      }
      legend={[
        { label: 'agent', color: 'var(--accent)' },
        { label: 'Q > 0', color: 'var(--easy)', shape: 'square' },
        { label: 'Q < 0', color: 'var(--hard)', shape: 'square' },
        { label: 'greedy action', color: 'var(--fg)', shape: 'line' },
      ]}
      below={
        <MiniPanel title="Return per episode" right={fr.returns.length ? fmt(fr.returns[fr.returns.length - 1], 2) : undefined}>
          <Stage aspect={0.22} min={100} max={130}>
            {(box) => <Returns box={box} returns={fr.returns} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'q_learning.py',
        vars: [
          { name: 'episode', value: String(Math.min(fr.episode + 1, EPISODES)) },
          { name: 'epsilon', value: epsilon.toFixed(2), color: 'var(--accent)' },
          { name: 'alpha · gamma', value: `${ALPHA} · ${GAMMA}` },
          { name: 's', value: `(${fr.agent[0]}, ${fr.agent[1]})` },
          { name: 'move', value: fr.explore === undefined ? '—' : fr.explore ? 'explore' : 'exploit', color: fr.explore ? 'var(--medium)' : 'var(--accent-2)' },
          { name: 'Q[start]', value: `max ${fmt(Math.max(...(fr.Q.get(key(...WORLD.start)) ?? [0])), 3)}` },
        ],
      }}
      params={
        <>
          <Slider label="Exploration ε" value={epsilon} min={0} max={0.6} step={0.05} onChange={setEpsilon} format={(v) => v.toFixed(2)} />
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg">
            Retrain
          </button>
        </>
      }
    />
  )
}

function Returns({ box, returns }: { box: Box; returns: number[] }) {
  const F = frame2d(box, [0, EPISODES], [-2.5, 1], { l: 30, b: 18, t: 6, r: 8 })
  // moving average for readability
  const avg = returns.map((_, i) => {
    const from = Math.max(0, i - 9)
    const w = returns.slice(from, i + 1)
    return w.reduce((s, v) => s + v, 0) / w.length
  })
  const pts = avg.map((v, i) => [F.sx(i), F.sy(Math.max(-2.5, v))] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={F} xTicks={6} yTicks={3} xLabel="episode (10-ep. average)" zeroLines digits={1} />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent)' }} />
    </svg>
  )
}
