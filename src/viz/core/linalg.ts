/** Tiny dense linear-algebra helpers (enough for the labs). */

/** Solve min ||A x - b|| with Householder QR. A is m×n (m ≥ n), row-major. */
export function lstsq(A: number[][], b: number[]): number[] {
  const m = A.length
  const n = A[0].length
  const R = A.map((row) => [...row])
  const y = [...b]
  for (let k = 0; k < n; k++) {
    let norm = 0
    for (let i = k; i < m; i++) norm += R[i][k] * R[i][k]
    norm = Math.sqrt(norm)
    if (norm === 0) continue
    const alpha = R[k][k] > 0 ? -norm : norm
    const v = new Array(m).fill(0)
    v[k] = R[k][k] - alpha
    for (let i = k + 1; i < m; i++) v[i] = R[i][k]
    let vv = 0
    for (let i = k; i < m; i++) vv += v[i] * v[i]
    if (vv === 0) continue
    for (let j = k; j < n; j++) {
      let s = 0
      for (let i = k; i < m; i++) s += v[i] * R[i][j]
      s = (2 * s) / vv
      for (let i = k; i < m; i++) R[i][j] -= s * v[i]
    }
    let s = 0
    for (let i = k; i < m; i++) s += v[i] * y[i]
    s = (2 * s) / vv
    for (let i = k; i < m; i++) y[i] -= s * v[i]
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i]
    for (let j = i + 1; j < n; j++) s -= R[i][j] * x[j]
    x[i] = Math.abs(R[i][i]) < 1e-12 ? 0 : s / R[i][i]
  }
  return x
}

/** Least-squares polynomial fit; returns coefficients c0..cd (ascending powers) in the variable u = (x - shift) * scale. */
export function polyfit(xs: number[], ys: number[], degree: number, shift = 0, scale = 1) {
  const A = xs.map((x) => {
    const u = (x - shift) * scale
    const row: number[] = []
    let p = 1
    for (let d = 0; d <= degree; d++) {
      row.push(p)
      p *= u
    }
    return row
  })
  const c = lstsq(A, ys)
  return (x: number) => {
    const u = (x - shift) * scale
    let s = 0
    for (let d = degree; d >= 0; d--) s = s * u + c[d]
    return s
  }
}

/** Symmetric 2×2 eigen-decomposition: returns eigenvalues (desc) and unit eigenvectors. */
export function eig2(a: number, b: number, d: number) {
  const tr = a + d
  const det = a * d - b * b
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det))
  const l1 = tr / 2 + disc
  const l2 = tr / 2 - disc
  const vec = (l: number): [number, number] => {
    let x = b
    let y = l - a
    if (Math.abs(x) + Math.abs(y) < 1e-12) {
      x = l - d
      y = b
    }
    if (Math.abs(x) + Math.abs(y) < 1e-12) return [1, 0]
    const n = Math.hypot(x, y)
    return [x / n, y / n]
  }
  return { values: [l1, l2] as [number, number], vectors: [vec(l1), vec(l2)] as [[number, number], [number, number]] }
}
