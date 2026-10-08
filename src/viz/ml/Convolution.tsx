import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Pills } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'
import { fmt } from '../core/math'

const CODE = `import numpy as np

def conv2d(image, kernel):
    kh, kw = kernel.shape
    out_h = image.shape[0] - kh + 1        # no padding, stride 1
    out_w = image.shape[1] - kw + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            patch = image[i:i + kh, j:j + kw]
            out[i, j] = np.sum(patch * kernel)   # multiply-accumulate
    return out

feature_map = np.maximum(conv2d(img, kernel), 0)          # ReLU
pooled = feature_map.reshape(3, 2, 3, 2).max(axis=(1, 3))  # 2×2 max-pool`

const IMG = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
]

type KernelId = 'vertical' | 'horizontal' | 'sharpen' | 'blur'
const KERNELS: Record<KernelId, { k: number[][]; label: string; note: string }> = {
  vertical: { label: 'Vertical edges', k: [[1, 0, -1], [1, 0, -1], [1, 0, -1]], note: 'This kernel responds where brightness changes from left to right — vertical edges light up (positive one side, negative the other).' },
  horizontal: { label: 'Horizontal edges', k: [[1, 1, 1], [0, 0, 0], [-1, -1, -1]], note: 'This kernel compares the row above with the row below — horizontal edges such as the top bar of the 7 light up.' },
  sharpen: { label: 'Sharpen', k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], note: 'Sharpen boosts a pixel relative to its neighbours, exaggerating contrast.' },
  blur: { label: 'Blur', k: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]], note: 'A box blur averages each 3×3 neighbourhood, smoothing the image.' },
}

interface Frame extends StepFrame {
  pos: number // 0..35 current output cell, -1 none
  filled: number
  relu: boolean
  pool: number // -1 none, 0..8
}

function conv(k: number[][]) {
  const out: number[][] = []
  for (let i = 0; i < 6; i++) {
    out.push([])
    for (let j = 0; j < 6; j++) {
      let s = 0
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += IMG[i + a][j + b] * k[a][b]
      out[i].push(s)
    }
  }
  return out
}

function* program(kid: KernelId): Generator<Frame, void, void> {
  yield { pos: -1, filled: 0, relu: false, pool: -1, line: [4, 7], dwell: 1.6, note: 'An 8×8 image and a 3×3 kernel. Without padding and with stride 1, the output is (8 − 3 + 1) × (8 − 3 + 1) = 6×6.' }
  for (let p = 0; p < 36; p++) {
    const slow = p < 3
    yield { pos: p, filled: p, relu: false, pool: -1, line: 10, dwell: slow ? 1.3 : 0.18, note: slow ? `Slide the kernel to position (${Math.floor(p / 6)}, ${p % 6}) and take the 3×3 patch under it.` : KERNELS[kid].note }
    yield { pos: p, filled: p + 1, relu: false, pool: -1, line: 11, dwell: slow ? 1.5 : 0.18, note: slow ? 'Multiply patch × kernel element-wise and add the 9 products: one number in the feature map.' : KERNELS[kid].note }
  }
  yield { pos: -1, filled: 36, relu: true, pool: -1, line: 14, dwell: 2, note: 'ReLU clips every negative response to 0, keeping only where the pattern matched.' }
  for (let q = 0; q < 9; q++) {
    yield { pos: -1, filled: 36, relu: true, pool: q, line: 15, dwell: q < 2 ? 1.2 : 0.5, note: '2×2 max-pooling keeps the strongest response in each block: the map shrinks to 3×3 and becomes tolerant to small shifts.' }
  }
  yield { pos: -1, filled: 36, relu: true, pool: 9, line: 15, dwell: 4, note: 'A CNN layer learns many kernels like this one; stacking layers turns edges into shapes and shapes into objects.' }
}

export default function Convolution() {
  const [kid, setKid] = useState<KernelId>('vertical')
  const out = useMemo(() => conv(KERNELS[kid].k), [kid])
  const player = usePlayer(() => program(kid), [kid], { interval: 600, loop: 2400 })
  const fr = player.frame
  const i = fr.pos >= 0 ? Math.floor(fr.pos / 6) : -1
  const j = fr.pos >= 0 ? fr.pos % 6 : -1
  return (
    <LabFrame
      title={`Convolution · ${KERNELS[kid].label.toLowerCase()} kernel`}
      status={fr.pool >= 0 ? 'max-pool' : fr.relu ? 'ReLU' : `cell ${Math.max(0, fr.filled)}/36`}
      player={player}
      stage={
        <Stage aspect={0.5} min={300} max={460}>
          {(box) => <Grids box={box} k={KERNELS[kid].k} out={out} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'positive', color: 'var(--accent-2)', shape: 'square' },
        { label: 'negative', color: 'var(--accent-3)', shape: 'square' },
        { label: 'kernel window', color: 'var(--accent)', shape: 'ring' },
      ]}
      code={{
        source: CODE,
        file: 'conv2d.py',
        vars: [
          { name: '(i, j)', value: i >= 0 ? `(${i}, ${j})` : '—' },
          { name: 'out[i, j]', value: i >= 0 && fr.filled > fr.pos ? fmt(out[i][j], 2) : '—', color: 'var(--accent)' },
          { name: 'out.shape', value: '(6, 6)' },
          { name: 'pooled.shape', value: '(3, 3)' },
        ],
      }}
      params={<Pills label="Kernel" value={kid} onChange={setKid} options={(Object.keys(KERNELS) as KernelId[]).map((k) => ({ value: k, label: KERNELS[k].label }))} />}
    />
  )
}

function cellColor(v: number, scale: number) {
  const t = Math.min(1, Math.abs(v) / scale)
  if (Math.abs(v) < 1e-9) return 'color-mix(in oklab, var(--fg) 4%, transparent)'
  return `color-mix(in oklab, ${v > 0 ? 'var(--accent-2)' : 'var(--accent-3)'} ${Math.round(18 + t * 70)}%, transparent)`
}

function Grids({ box, k, out, f }: { box: Box; k: number[][]; out: number[][]; f: Frame }) {
  const narrow = box.width < 480
  // units: input 8, kernel 3, output 6, pooled 3 (+ gaps)
  const gap = 1.3
  const units = narrow ? Math.max(8 + gap + 3, 6 + gap + 3) : 8 + 6 + 3 + 3 * gap
  const cell = Math.min(narrow ? (box.width - 24) / units : (box.width - 32) / (units + 3 + gap), narrow ? (box.height - 70) / (8 + 6 + 1) : (box.height - 60) / 8)
  const top = narrow ? 26 : (box.height - 8 * cell) / 2 + 6
  const left = narrow ? (box.width - (8 + gap + 3) * cell) / 2 : (box.width - (8 + 3 + 6 + 3 + 4 * gap) * cell) / 2
  const inX = left
  const kX = inX + (8 + gap) * cell
  const outX = narrow ? (box.width - (6 + gap + 3) * cell) / 2 : kX + (3 + gap) * cell
  const outY = narrow ? top + (8 + 1.6) * cell : top
  const poolX = outX + (6 + gap) * cell
  const kY = top
  const scale = Math.max(1, ...out.flat().map(Math.abs))
  const i = f.pos >= 0 ? Math.floor(f.pos / 6) : -1
  const j = f.pos >= 0 ? f.pos % 6 : -1
  const val = (a: number, b: number) => {
    const v = out[a][b]
    return f.relu ? Math.max(0, v) : v
  }
  const pooled = (q: number) => {
    const r = Math.floor(q / 3)
    const c = q % 3
    return Math.max(val(2 * r, 2 * c), val(2 * r, 2 * c + 1), val(2 * r + 1, 2 * c), val(2 * r + 1, 2 * c + 1))
  }
  const fs = Math.max(8, Math.min(12, cell * 0.36))
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="A kernel sliding over an image to produce a feature map">
      <text x={inX} y={top - 9} className="viz-label">input 8×8</text>
      {IMG.map((row, r) =>
        row.map((v, c) => (
          <rect key={`i${r}${c}`} x={inX + c * cell + 1} y={top + r * cell + 1} width={cell - 2} height={cell - 2} rx={3} style={{ fill: v ? 'var(--fg)' : 'color-mix(in oklab, var(--fg) 6%, transparent)' }} />
        )),
      )}
      {i >= 0 && (
        <motion.rect
          initial={false}
          animate={{ x: inX + j * cell - 1, y: top + i * cell - 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          width={3 * cell + 2}
          height={3 * cell + 2}
          rx={6}
          fill="none"
          strokeWidth={2.5}
          style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 6px var(--accent))' }}
        />
      )}

      <text x={kX} y={kY - 9} className="viz-label">kernel 3×3</text>
      {k.map((row, r) =>
        row.map((v, c) => {
          const prod = i >= 0 ? IMG[i + r][j + c] * v : null
          return (
            <g key={`k${r}${c}`}>
              <rect x={kX + c * cell + 1} y={kY + r * cell + 1} width={cell - 2} height={cell - 2} rx={3} style={{ fill: cellColor(v, 1), stroke: 'var(--accent)', strokeOpacity: 0.4 }} />
              <text x={kX + c * cell + cell / 2} y={kY + r * cell + cell / 2 + fs * 0.36} textAnchor="middle" fontSize={fs} className="viz-text">
                {Math.abs(v - 1 / 9) < 1e-9 ? '⅑' : v}
              </text>
              {prod !== null && (
                <text x={kX + c * cell + cell / 2} y={kY + (r + 3.6) * cell + cell / 2} textAnchor="middle" fontSize={fs * 0.92} style={{ fill: prod ? 'var(--fg)' : 'var(--fg-subtle)' }} className="font-mono">
                  {Math.abs(prod) < 1e-9 ? '0' : fmt(prod, Math.abs(v - 1 / 9) < 1e-9 ? 2 : 0)}
                </text>
              )}
            </g>
          )
        }),
      )}
      {i >= 0 && !narrow && (
        <text x={kX} y={kY + 3.4 * cell} className="viz-label">
          patch × kernel
        </text>
      )}
      {i >= 0 && !narrow && (
        <text x={kX} y={kY + 7.5 * cell} fontSize={fs + 1} className="viz-text">
          Σ = {f.filled > f.pos ? fmt(out[i][j], 2) : '…'}
        </text>
      )}

      <text x={outX} y={outY - 9} className="viz-label">{f.relu ? 'ReLU(feature map)' : 'feature map 6×6'}</text>
      {out.map((row, r) =>
        row.map((_, c) => {
          const idx = r * 6 + c
          const shown = idx < f.filled
          const v = val(r, c)
          const inPool = f.pool >= 0 && f.pool < 9 && Math.floor(r / 2) === Math.floor(f.pool / 3) && Math.floor(c / 2) === f.pool % 3
          return (
            <g key={`o${r}${c}`}>
              <motion.rect
                x={outX + c * cell + 1}
                y={outY + r * cell + 1}
                width={cell - 2}
                height={cell - 2}
                rx={3}
                initial={false}
                animate={{ opacity: shown ? 1 : 0.25 }}
                strokeWidth={inPool ? 2 : idx === f.pos ? 2 : 0}
                style={{ fill: shown ? cellColor(v, scale) : 'color-mix(in oklab, var(--fg) 4%, transparent)', stroke: inPool || idx === f.pos ? 'var(--accent)' : 'none', transition: 'fill 0.35s' }}
              />
              {shown && cell > 22 && (
                <text x={outX + c * cell + cell / 2} y={outY + r * cell + cell / 2 + fs * 0.34} textAnchor="middle" fontSize={fs * 0.9} className="viz-text">
                  {Math.abs(v) < 1e-9 ? '0' : fmt(v, Math.abs(v) < 10 && v % 1 !== 0 ? 1 : 0)}
                </text>
              )}
            </g>
          )
        }),
      )}

      <text x={poolX} y={outY - 9} className="viz-label">max-pool 3×3</text>
      {Array.from({ length: 9 }).map((_, q) => {
        const shown = f.pool > q || f.pool === 9
        const r = Math.floor(q / 3)
        const c = q % 3
        const v = pooled(q)
        return (
          <g key={`p${q}`}>
            <motion.rect
              x={poolX + c * cell * 1.15 + 1}
              y={outY + r * cell * 1.15 + 1}
              width={cell * 1.15 - 3}
              height={cell * 1.15 - 3}
              rx={4}
              initial={false}
              animate={{ opacity: shown || f.pool === q ? 1 : 0.25, scale: f.pool === q ? 1.08 : 1 }}
              style={{ fill: shown || f.pool === q ? cellColor(v, scale) : 'color-mix(in oklab, var(--fg) 4%, transparent)', stroke: f.pool === q ? 'var(--accent)' : 'none', strokeWidth: 2 }}
            />
            {(shown || f.pool === q) && (
              <text x={poolX + c * cell * 1.15 + (cell * 1.15) / 2} y={outY + r * cell * 1.15 + (cell * 1.15) / 2 + fs * 0.34} textAnchor="middle" fontSize={fs} className="viz-text">
                {fmt(v, v % 1 !== 0 ? 1 : 0)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
