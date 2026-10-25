import * as THREE from 'three'
import { getLang } from '../i18n'

export const DEG = Math.PI / 180

/** Matches the UV layout of THREE.SphereGeometry with an equirectangular texture. */
export function latLonToVector3(lat: number, lon: number, radius = 1, target = new THREE.Vector3()) {
  const phi = lat * DEG
  const lambda = lon * DEG
  return target.set(
    radius * Math.cos(phi) * Math.cos(lambda),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(lambda),
  )
}

export function formatLatLon(lat: number, lon: number) {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : getLang() === 'fr' ? 'O' : 'W'
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lon).toFixed(2)}° ${ew}`
}

/** Accent- and case-insensitive key for search. */
export function searchKey(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

const toPoint = new THREE.Vector3()

/** True if the segment camera → point passes through the globe. */
export function hiddenByGlobe(camera: THREE.Vector3, point: THREE.Vector3) {
  toPoint.subVectors(point, camera)
  const len = toPoint.length()
  toPoint.divideScalar(len)
  const b = camera.dot(toPoint)
  const c = camera.lengthSq() - 1
  const disc = b * b - c
  if (disc < 0) return false
  const hit = -b - Math.sqrt(disc)
  return hit > 0 && hit < len
}
