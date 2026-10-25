import * as THREE from 'three'
import type { Country } from '../lib/countries'

/** Camera distance from the globe centre that frames a country. */
export function zoneDistance(country: Country) {
  return 1 + THREE.MathUtils.clamp(country.extent * 3.8, 0.5, 2.1)
}

/** A little further back than the zone view, to leave room for the monoliths. */
export function eventsDistance(country: Country) {
  return 1 + (zoneDistance(country) - 1) * 1.35
}
