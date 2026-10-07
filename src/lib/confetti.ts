import { prefersReducedMotion } from './utils'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  vr: number
  color: string
  shape: 0 | 1
}

/** Tiny dependency-free confetti burst drawn on a temporary full-screen canvas. */
export function confettiBurst(x: number, y: number, count = 90) {
  if (typeof window === 'undefined' || prefersReducedMotion()) return
  const style = getComputedStyle(document.documentElement)
  const colors = ['--accent', '--accent-2', '--accent-3', '--easy', '--medium'].map(
    (v) => style.getPropertyValue(v).trim() || '#8b7dff',
  )
  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '400',
  })
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }
  ctx.scale(dpr, dpr)

  const n = window.innerWidth < 640 ? Math.round(count * 0.6) : count
  const parts: Particle[] = Array.from({ length: n }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9
    const speed = 6 + Math.random() * 9
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() < 0.5 ? 0 : 1,
    }
  })

  const start = performance.now()
  const duration = 1700
  const frame = (now: number) => {
    const t = now - start
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const fade = Math.max(0, 1 - t / duration)
    for (const p of parts) {
      p.vy += 0.28
      p.vx *= 0.985
      p.vy *= 0.985
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      ctx.save()
      ctx.globalAlpha = fade
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    if (t < duration) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
}
