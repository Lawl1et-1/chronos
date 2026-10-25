import * as THREE from 'three'
import type { Country } from '../lib/countries'
import { latLonToVector3 } from '../lib/geo'

/**
 * The real timeline and the alternate branches are arcs that start together above
 * the zone and run east along a parallel. Each branch peels away from its parent:
 * the root rises away from reality, sub-branches split off at their fork milestone.
 */
export const BRANCH_RADIUS = 1.32
const SWEEP = 105

export interface BranchFrame {
  /** Zone on the surface, where the stem starts. */
  n: THREE.Vector3
  /** Latitude of the arcs, kept away from the poles so they stay wide. */
  lat: number
  lon: number
}

/** One level of divergence: where it starts (t), which way it goes, and how far. */
export interface Split {
  from: number
  sign: 1 | -1
  rise: number
  lift: number
}

export const ROOT_SPLIT: Split = { from: 0, sign: 1, rise: 14, lift: 0.3 }
export function subSplit(from: number, sibling: number): Split {
  // first fork goes up, second down, and so on
  return { from, sign: sibling % 2 === 0 ? 1 : -1, rise: 8, lift: 0.1 }
}

export function branchFrame(country: Country): BranchFrame {
  const [lat, lon] = country.center
  return {
    n: latLonToVector3(lat, lon, 1),
    lat: THREE.MathUtils.clamp(lat, -40, 40),
    lon,
  }
}

/** How far a split has drifted at t (0 before it starts, 1 once fully apart). */
function drift(split: Split, t: number) {
  if (t <= split.from) return 0
  return THREE.MathUtils.smoothstep((t - split.from) / (1 - split.from || 1), 0, 0.45)
}

/** Point at time t on the arc defined by a chain of splits (empty chain = reality). */
export function arcPoint(f: BranchFrame, splits: Split[], t: number, target = new THREE.Vector3()) {
  let lat = f.lat
  let radius = BRANCH_RADIUS
  for (const s of splits) {
    const d = drift(s, t)
    lat += s.sign * s.rise * d
    radius += s.lift * d
  }
  const root = splits.length ? drift(splits[0], t) : 0
  return latLonToVector3(lat, f.lon + t * SWEEP * (1 - 0.12 * root), radius, target)
}

export const realPoint = (f: BranchFrame, t: number, target?: THREE.Vector3) => arcPoint(f, [], t, target)

/** Years covered by the arcs: from the divergence to 100 years later, 2025 at most. */
export function branchSpan(divergenceYear: number): [number, number] {
  return [divergenceYear, Math.max(divergenceYear + 5, Math.min(2025, divergenceYear + 100))]
}

// Logarithmic scale: the first years after the divergence hold the most milestones.
const K = 4
export function yearToBranchT(year: number, [y0, y1]: [number, number]) {
  const d = THREE.MathUtils.clamp(year - y0, 0, y1 - y0)
  return Math.log1p(d / K) / Math.log1p((y1 - y0) / K)
}

/** Looks at the middle of the arcs, far enough back to see them whole. */
export function branchCamera(f: BranchFrame, fov: number, aspect: number) {
  const dir = latLonToVector3(f.lat + ROOT_SPLIT.rise * 0.45, f.lon + SWEEP * 0.5, 1)
  const halfWidth = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect
  return { dir, dist: THREE.MathUtils.clamp(1.95 / halfWidth, 4.2, 9) }
}
