import * as THREE from 'three'
import { translate } from '../i18n'

export const YEAR_MIN = -3000
export const YEAR_MAX = 2020

// Piecewise-linear year → t mapping: recent centuries get more room on the spiral.
const ANCHORS: [number, number][] = [
  [-3000, 0],
  [-1000, 0.12],
  [1, 0.22],
  [500, 0.3],
  [1000, 0.39],
  [1500, 0.53],
  [1800, 0.7],
  [1900, 0.82],
  [2020, 1],
]

export function clampYear(year: number) {
  const y = Math.round(THREE.MathUtils.clamp(year, YEAR_MIN, YEAR_MAX))
  return y === 0 ? 1 : y // there is no year zero
}

export function yearToT(year: number) {
  const y = THREE.MathUtils.clamp(year, YEAR_MIN, YEAR_MAX)
  for (let i = 1; i < ANCHORS.length; i++) {
    const [y1, t1] = ANCHORS[i]
    if (y <= y1) {
      const [y0, t0] = ANCHORS[i - 1]
      return t0 + ((y - y0) / (y1 - y0)) * (t1 - t0)
    }
  }
  return 1
}

export function tToYear(t: number) {
  const c = THREE.MathUtils.clamp(t, 0, 1)
  for (let i = 1; i < ANCHORS.length; i++) {
    const [y1, t1] = ANCHORS[i]
    if (c <= t1) {
      const [y0, t0] = ANCHORS[i - 1]
      return clampYear(y0 + ((c - t0) / (t1 - t0)) * (y1 - y0))
    }
  }
  return YEAR_MAX
}

export function formatYear(year: number) {
  return year < 0 ? `${-year} ${translate('era.bc')}` : String(year)
}

export function formatRange(start: number, end: number) {
  if (start === end) return formatYear(start)
  if (start < 0 && end < 0) return `${-start}–${-end} ${translate('era.bc')}`
  return `${formatYear(start)} – ${formatYear(end)}`
}

// Helix around the globe: bottom = oldest, top = most recent.
export const HELIX_RADIUS = 1.5
export const HELIX_TURNS = 2.5
export const HELIX_HEIGHT = 1.7

export function helixAngle(t: number) {
  return t * HELIX_TURNS * Math.PI * 2
}

/** Same angular convention as latLonToVector3 (angle = longitude). */
export function helixPoint(t: number, target = new THREE.Vector3(), radius = HELIX_RADIUS) {
  const a = helixAngle(t)
  return target.set(radius * Math.cos(a), (t - 0.5) * HELIX_HEIGHT, -radius * Math.sin(a))
}
