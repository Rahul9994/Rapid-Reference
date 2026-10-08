import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Stage, curve, frame2d, type Box } from '../core/plot'
import { CLASS_COLORS } from '../core/datasets'

const CODE = `import numpy as np
from sklearn.svm import SVC

x = np.array([-3, -2.4, -1.9, -0.9, -0.4, 0.1, 0.6, 1.0, 1.8, 2.5, 3.0])
y = (np.abs(x) < 1.3).astype(int)    # inner vs outer: no single cut works

phi = np.column_stack([x, x ** 2])   # lift every point: x → (x, x²)
clf = SVC(kernel="linear").fit(phi, y)   # a straight line now separates

# The kernel trick: same idea, without ever building phi
clf = SVC(kernel="poly", degree=2).fit(x.reshape(-1, 1), y)`

const XS = [-3, -2.4, -1.9, -0.9, -0.4, 0.1, 0.6, 1.0, 1.8, 2.5, 3.0]
const CUT = 1.69 // x² threshold separating the classes

interface Frame extends StepFrame {
  lift: number
  phase: 'flat' | 'try' | 'lift' | 'cut' | 'back'
}

function* program(): Generator<Frame, void, void> {
  yield { lift: 0, phase: 'flat', line: [4, 5], dwell: 2, note: 'In 1-D the inner class is surrounded by the outer class. No single threshold on x can separate them.' }
  yield { lift: 0, phase: 'try', line: [4, 5], dwell: 2, note: 'Any cut point leaves mistakes on one side or the other.' }
  yield { lift: 1, phase: 'lift', line: 7, dwell: 2.4, note: 'Add a feature: map x → (x, x²). Outer points have large x², so they rise above the inner ones.' }
  yield { lift: 1, phase: 'cut', line: 8, dwell: 2.6, note: 'In the lifted space a straight (horizontal) line separates the classes perfectly — a linear SVM can do it.' }
  yield { lift: 0, phase: 'back', line: 11, dwell: 3, note: 'Projected back to 1-D, that line becomes two thresholds — a non-linear boundary. Kernels compute this without building the new features explicitly.' }
}

export default function SvmKernel() {
  const player = usePlayer(program, [], { interval: 700, loop: 1600 })
  const fr = player.frame
  return (
    <LabFrame
      title="The kernel trick · lifting to a higher dimension"
      player={player}
      stage={
        <Stage aspect={0.55} min={240} max={400}>
          {(box) => <Lift box={box} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'outer class (y = 0)', color: CLASS_COLORS[0] },
        { label: 'inner class (y = 1)', color: CLASS_COLORS[1] },
        { label: 'separator', color: 'var(--accent)', shape: 'line' },
      ]}
      code={{ source: CODE, file: 'kernel_trick.py' }}
    />
  )
}

function Lift({ box, f }: { box: Box; f: Frame }) {
  const fr = frame2d(box, [-3.4, 3.4], [-0.8, 10], { l: 34, b: 26, t: 12, r: 12 })
  const { sx, sy } = fr
  const lifted = f.lift === 1
  const sep = Math.sqrt(CUT)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Points lifted onto a parabola become linearly separable">
      <Axes f={fr} xLabel="x" yLabel={lifted ? 'x²' : ''} zeroLines />
      <motion.path d={curve(fr, (x) => x * x)} fill="none" strokeWidth={1.5} strokeDasharray="4 5" animate={{ opacity: lifted ? 0.7 : 0 }} style={{ stroke: 'var(--fg-subtle)' }} />
      {f.phase === 'try' &&
        [-1.4, 0.3, 1.5].map((t, i) => (
          <motion.line key={t} x1={sx(t)} x2={sx(t)} y1={fr.top} y2={fr.bottom} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.9, delay: i * 0.6 }} strokeWidth={2} strokeDasharray="5 5" style={{ stroke: 'var(--hard)' }} />
        ))}
      <motion.line
        x1={fr.left}
        x2={fr.right}
        initial={false}
        animate={{ y1: sy(CUT), y2: sy(CUT), opacity: f.phase === 'cut' ? 1 : 0 }}
        strokeWidth={2.5}
        style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 6px var(--accent))' }}
      />
      {[-sep, sep].map((t) => (
        <motion.line key={t} x1={sx(t)} x2={sx(t)} y1={fr.top} y2={fr.bottom} initial={false} animate={{ opacity: f.phase === 'back' ? 1 : 0 }} strokeWidth={2.5} style={{ stroke: 'var(--accent)' }} />
      ))}
      {XS.map((x, i) => {
        const inner = Math.abs(x) < 1.3
        return (
          <motion.circle
            key={i}
            cx={sx(x)}
            initial={false}
            animate={{ cy: sy(lifted ? x * x : 0) }}
            transition={{ type: 'spring', stiffness: 90, damping: 14, delay: i * 0.04 }}
            r={7}
            strokeWidth={2}
            style={{ fill: CLASS_COLORS[inner ? 1 : 0], stroke: 'var(--bg)' }}
          />
        )
      })}
    </svg>
  )
}
