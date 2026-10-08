import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'
import { rng } from '../core/math'

const CODE = `def reflex_vacuum_agent(percept):
    location, status = percept
    if status == "Dirty":
        return "Suck"
    elif location == "A":
        return "Right"
    else:
        return "Left"

score = 0
for t in range(steps):
    percept = env.sense()                  # sensors: (location, status)
    action = reflex_vacuum_agent(percept)  # condition–action rule
    env.execute(action)                    # actuators change the world
    score += env.clean_rooms()             # performance measure`

type Room = 'A' | 'B'
type Action = 'Suck' | 'Right' | 'Left'

interface Frame extends StepFrame {
  t: number
  loc: Room
  dirt: Record<Room, boolean>
  percept?: [Room, 'Dirty' | 'Clean']
  action?: Action
  score: number
  stage: 'sense' | 'think' | 'act' | 'env'
}

function* program(p: number, seed: number): Generator<Frame, void, void> {
  const r = rng(seed)
  let loc: Room = 'A'
  const dirt: Record<Room, boolean> = { A: true, B: true }
  let score = 0
  for (let t = 0; t < 40; t++) {
    const slow = t < 3
    const percept: [Room, 'Dirty' | 'Clean'] = [loc, dirt[loc] ? 'Dirty' : 'Clean']
    yield { t, loc, dirt: { ...dirt }, percept, score, stage: 'sense', line: 12, dwell: slow ? 1.3 : 0.45, note: slow ? `Sense: the agent only perceives its own square → (${percept[0]}, ${percept[1]}).` : `t = ${t}: percept (${percept[0]}, ${percept[1]})` }
    const action: Action = percept[1] === 'Dirty' ? 'Suck' : loc === 'A' ? 'Right' : 'Left'
    yield { t, loc, dirt: { ...dirt }, percept, action, score, stage: 'think', line: action === 'Suck' ? [3, 4] : action === 'Right' ? [5, 6] : [7, 8], dwell: slow ? 1.4 : 0.45, note: slow ? `Condition–action rule fires → ${action}. No memory, no planning: just percept → action.` : `t = ${t}: rule → ${action}` }
    if (action === 'Suck') dirt[loc] = false
    else loc = action === 'Right' ? 'B' : 'A'
    yield { t, loc, dirt: { ...dirt }, percept, action, score, stage: 'act', line: 14, dwell: slow ? 1.2 : 0.45, note: slow ? `Act: the actuators ${action === 'Suck' ? 'clean the square' : `move to ${loc}`}.` : `t = ${t}: ${action}` }
    for (const room of ['A', 'B'] as Room[]) if (!dirt[room] && r.next() < p) dirt[room] = true
    score += (dirt.A ? 0 : 1) + (dirt.B ? 0 : 1)
    yield { t, loc, dirt: { ...dirt }, percept, action, score, stage: 'env', line: 15, dwell: slow ? 1.2 : 0.4, note: slow ? 'The environment may change on its own (dirt reappears). Performance measure: +1 for every clean square, every time step.' : `t = ${t}: score ${score}` }
  }
  yield { t: 40, loc, dirt: { ...dirt }, score, stage: 'env', line: 15, dwell: 5, note: `Score after 40 steps: ${score} / 80. A simple reflex agent works here because the right action depends only on the current percept.` }
}

export default function VacuumAgent() {
  const [p, setP] = useState(0.1)
  const [seed, setSeed] = useState(1)
  const player = usePlayer(() => program(p, seed), [p, seed], { interval: 650, loop: 2000 })
  const fr = player.frame
  return (
    <LabFrame
      title="Intelligent agent · the vacuum world"
      status={`t = ${fr.t} · score ${fr.score}`}
      player={player}
      stage={
        <Stage aspect={0.56} min={300} max={440}>
          {(box) => <World box={box} f={fr} />}
        </Stage>
      }
      code={{
        source: CODE,
        file: 'reflex_agent.py',
        vars: [
          { name: 'percept', value: fr.percept ? `('${fr.percept[0]}', '${fr.percept[1]}')` : '—', color: 'var(--accent-2)' },
          { name: 'action', value: fr.action && fr.stage !== 'sense' ? `'${fr.action}'` : '—', color: 'var(--accent)' },
          { name: 'score', value: String(fr.score), color: 'var(--easy)' },
          { name: 't', value: String(fr.t) },
        ],
      }}
      params={
        <>
          <Slider label="Dirt reappears (per step)" value={p} min={0} max={0.4} step={0.05} onChange={setP} format={(v) => `${Math.round(v * 100)}%`} />
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg">
            New run
          </button>
        </>
      }
    />
  )
}

const LOOP = ['sense', 'think', 'act', 'env'] as const
const LOOP_LABEL: Record<(typeof LOOP)[number], string> = { sense: 'Sensors', think: 'Agent program', act: 'Actuators', env: 'Environment' }

function World({ box, f }: { box: Box; f: Frame }) {
  const pad = 18
  const roomsH = box.height * 0.62
  const roomW = (box.width - pad * 3) / 2
  const roomX = (r: Room) => (r === 'A' ? pad : pad * 2 + roomW)
  const roomY = 18
  const robotX = roomX(f.loc) + roomW / 2
  const robotY = roomY + roomsH * 0.6
  const loopY = roomY + roomsH + 26
  const stepW = (box.width - pad * 2) / 4
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Two-room vacuum world">
      {(['A', 'B'] as Room[]).map((room) => (
        <g key={room}>
          <rect x={roomX(room)} y={roomY} width={roomW} height={roomsH} rx={18} strokeWidth={1.5} style={{ fill: f.dirt[room] ? 'color-mix(in oklab, var(--medium) 10%, var(--bg-elev))' : 'color-mix(in oklab, var(--easy) 8%, var(--bg-elev))', stroke: 'var(--border-strong)', transition: 'fill 0.5s' }} />
          <text x={roomX(room) + 16} y={roomY + 28} fontSize={18} fontWeight={700} className="viz-text">
            {room}
          </text>
          <text x={roomX(room) + roomW - 14} y={roomY + 26} textAnchor="end" fontSize={11} style={{ fill: f.dirt[room] ? 'var(--medium)' : 'var(--easy)' }} className="font-mono">
            {f.dirt[room] ? 'dirty' : 'clean'}
          </text>
          <AnimatePresence>
            {f.dirt[room] &&
              Array.from({ length: 9 }).map((_, k) => (
                <motion.circle
                  key={`${room}-${k}`}
                  cx={roomX(room) + roomW * (0.22 + ((k * 37) % 60) / 100)}
                  cy={roomY + roomsH * (0.45 + ((k * 23) % 45) / 100)}
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: 3 + (k % 3), opacity: 0.8 }}
                  exit={{ r: 0, opacity: 0, cx: robotX, cy: robotY }}
                  transition={{ duration: 0.45, delay: k * 0.02 }}
                  style={{ fill: 'var(--medium)' }}
                />
              ))}
          </AnimatePresence>
        </g>
      ))}
      <motion.g initial={false} animate={{ x: robotX, y: robotY }} transition={{ type: 'spring', stiffness: 90, damping: 15 }}>
        <motion.g animate={f.action === 'Suck' && f.stage === 'act' ? { rotate: [0, 12, -12, 0] } : { rotate: 0 }} transition={{ duration: 0.6 }}>
          <circle r={26} strokeWidth={2.5} style={{ fill: 'var(--bg-elev)', stroke: 'var(--accent)', filter: 'drop-shadow(0 6px 14px color-mix(in oklab, var(--accent) 40%, transparent))' }} />
          <circle r={17} style={{ fill: 'color-mix(in oklab, var(--accent) 20%, transparent)' }} />
          <circle cx={-7} cy={-4} r={3} style={{ fill: 'var(--fg)' }} />
          <circle cx={7} cy={-4} r={3} style={{ fill: 'var(--fg)' }} />
          <path d="M-6,6 Q0,10 6,6" fill="none" strokeWidth={2} strokeLinecap="round" style={{ stroke: 'var(--fg)' }} />
        </motion.g>
        <AnimatePresence mode="wait">
          {f.percept && (f.stage === 'sense' || f.stage === 'think') && (
            <motion.g key={`${f.stage}-${f.t}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <rect x={-62} y={-74} width={124} height={30} rx={10} style={{ fill: 'var(--bg-elev)', stroke: f.stage === 'sense' ? 'var(--accent-2)' : 'var(--accent)' }} />
              <text y={-54} textAnchor="middle" fontSize={11.5} className="font-mono" style={{ fill: 'var(--fg)' }}>
                {f.stage === 'sense' ? `(${f.percept[0]}, ${f.percept[1]})` : `→ ${f.action}`}
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </motion.g>
      {/* agent–environment loop */}
      {LOOP.map((s, i) => {
        const on = f.stage === s
        const x = pad + i * stepW
        return (
          <g key={s}>
            <rect x={x + 4} y={loopY} width={stepW - 8} height={34} rx={11} strokeWidth={1.5} style={{ fill: on ? 'color-mix(in oklab, var(--accent) 22%, var(--bg-elev))' : 'var(--bg-elev)', stroke: on ? 'var(--accent)' : 'var(--border)', transition: 'fill 0.3s, stroke 0.3s' }} />
            <text x={x + stepW / 2} y={loopY + 21} textAnchor="middle" fontSize={Math.min(12, stepW / 9)} style={{ fill: on ? 'var(--fg)' : 'var(--fg-muted)' }}>
              {LOOP_LABEL[s]}
            </text>
            {i < 3 && <path d={`M${x + stepW - 6},${loopY + 17} l8,0`} strokeWidth={1.5} style={{ stroke: 'var(--fg-subtle)' }} />}
          </g>
        )
      })}
    </svg>
  )
}
