import * as THREE from 'three'
import type { Country } from '../lib/countries'
import { latLonToVector3 } from '../lib/geo'

/**
 * The real timeline and the alternate branch are two arcs that start together above
 * the zone and run east along a parallel; the branch rises away as time passes.
 */
export const BRANCH_RADIUS = 1.32
const SWEEP = 105
const RISE = 14

export interface BranchFrame {
  /** Zone on the surface, where the stem starts. */
  n: THREE.Vector3
  /** Latitude of the arcs, kept away from the poles so they stay wide. */
  lat: number
  lon: number
}

export function branchFrame(country: Country): BranchFrame {
  const [lat, lon] = country.center
  return {
    n: latLonToVector3(lat, lon, 1),
    lat: THREE.MathUtils.clamp(lat, -40, 40),
    lon,
  }
}

export function realPoint(f: BranchFrame, t: number, target = new THREE.Vector3()) {
  return latLonToVector3(f.lat, f.lon + t * SWEEP, BRANCH_RADIUS, target)
}

/** How far the branch has drifted from reality at t (0 → 1). */
export const divergence = (t: number) => THREE.MathUtils.smoothstep(t, 0, 0.45)

export function altPoint(f: BranchFrame, t: number, target = new THREE.Vector3()) {
  const s = divergence(t)
  return latLonToVector3(f.lat + RISE * s, f.lon + t * SWEEP * (1 - 0.12 * s), BRANCH_RADIUS + 0.3 * s, target)
}

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

/** Looks at the middle of both arcs, far enough back to see them whole. */
export function branchCamera(f: BranchFrame, fov: number, aspect: number) {
  const dir = latLonToVector3(f.lat + RISE * 0.45, f.lon + SWEEP * 0.5, 1)
  const halfWidth = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect
  return { dir, dist: THREE.MathUtils.clamp(1.95 / halfWidth, 4.2, 9) }
}
