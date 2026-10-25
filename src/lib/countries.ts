import * as THREE from 'three'
import { feature } from 'topojson-client'
import { geoArea, geoBounds, geoCentroid, geoEquirectangular, geoPath } from 'd3-geo'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import isoCountries from 'i18n-iso-countries'
import fr from 'i18n-iso-countries/langs/fr.json'
import { DEG, latLonToVector3 } from './geo'

isoCountries.registerLocale(fr)

export type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }>

export interface Country {
  /** 1-based index, also the value stored in the ID map (0 = ocean). */
  index: number
  iso: string | null
  name: string
  feature: CountryFeature
  /** Centroid of the largest landmass, [lat, lon]. */
  center: [number, number]
  /** Approximate angular radius in radians, used to frame the camera. */
  extent: number
}

export interface CountryData {
  countries: Country[]
  idTexture: THREE.DataTexture
  borders: THREE.BufferGeometry
  indexAtUv: (u: number, v: number) => number
}

const ID_W = 4096
const ID_H = 2048
const BORDER_RADIUS = 1.0015

// Each index gets a colour with two checksum channels, so antialiased edge
// pixels (blends of two colours) fail the check and fall back to "ocean".
const g = (i: number) => (i * 37 + 11) & 255
const b = (i: number) => (i * 91 + 53) & 255

function largestPolygon(f: CountryFeature): Feature<Polygon> {
  if (f.geometry.type === 'Polygon') return f as Feature<Polygon>
  let best = f.geometry.coordinates[0]
  let bestArea = -1
  for (const coordinates of f.geometry.coordinates) {
    const area = geoArea({ type: 'Polygon', coordinates })
    if (area > bestArea) {
      bestArea = area
      best = coordinates
    }
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: best } }
}

function frenchName(id: string | undefined, fallback: string) {
  const alpha2 = id ? isoCountries.numericToAlpha2(id) : undefined
  return (alpha2 && isoCountries.getName(alpha2, 'fr')) || fallback
}

function rings(f: CountryFeature): Position[][] {
  return f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat()
}

/** Line segments following every ring, subdivided so long edges hug the sphere. */
export function ringsToSegments(f: CountryFeature | CountryFeature[], radius = BORDER_RADIUS) {
  const out: number[] = []
  const a = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (const feat of Array.isArray(f) ? f : [f]) {
    for (const ring of rings(feat)) {
      for (let k = 0; k < ring.length - 1; k++) {
        const [lon0, lat0] = ring[k]
        const [lon1, lat1] = ring[k + 1]
        let dLon = lon1 - lon0
        if (dLon > 180) dLon -= 360
        if (dLon < -180) dLon += 360
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dLon), Math.abs(lat1 - lat0)) / 1.5))
        for (let s = 0; s < steps; s++) {
          latLonToVector3(lat0 + ((lat1 - lat0) * s) / steps, lon0 + (dLon * s) / steps, radius, a)
          latLonToVector3(lat0 + ((lat1 - lat0) * (s + 1)) / steps, lon0 + (dLon * (s + 1)) / steps, radius, c)
          out.push(a.x, a.y, a.z, c.x, c.y, c.z)
        }
      }
    }
  }
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
  return geom
}

function buildIdMap(countries: Country[]) {
  const canvas = document.createElement('canvas')
  canvas.width = ID_W
  canvas.height = ID_H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, ID_W, ID_H)
  const projection = geoEquirectangular()
    .scale(ID_W / (2 * Math.PI))
    .translate([ID_W / 2, ID_H / 2])
    .precision(0.1)
  const path = geoPath(projection, ctx)
  for (const c of countries) {
    ctx.fillStyle = `rgb(${c.index},${g(c.index)},${b(c.index)})`
    ctx.beginPath()
    path(c.feature)
    ctx.fill()
  }
  const rgba = ctx.getImageData(0, 0, ID_W, ID_H).data
  const ids = new Uint8Array(ID_W * ID_H)
  for (let p = 0, q = 0; p < ids.length; p++, q += 4) {
    const i = rgba[q]
    ids[p] = i !== 0 && rgba[q + 1] === g(i) && rgba[q + 2] === b(i) ? i : 0
  }
  return ids
}

async function load(): Promise<CountryData> {
  const topo = await fetch('/geo/countries-50m.json').then((r) => r.json())
  const collection = feature(topo, topo.objects.countries) as unknown as { features: CountryFeature[] }
  if (collection.features.length > 254) throw new Error('Too many countries for an 8-bit ID map')

  const countries: Country[] = collection.features.map((f, k) => {
    const main = largestPolygon(f)
    const [lon, lat] = geoCentroid(main)
    const [[west, south], [east, north]] = geoBounds(main)
    const lonSpan = (((east - west) % 360) + 360) % 360
    const span = Math.max(north - south, lonSpan * Math.cos(lat * DEG)) * DEG
    const id = f.id === undefined ? undefined : String(f.id)
    return {
      index: k + 1,
      iso: id ?? null,
      name: frenchName(id, f.properties.name),
      feature: f,
      center: [lat, lon],
      extent: Math.max(Math.sqrt(geoArea(main) / Math.PI), span / 2.6),
    }
  })

  const idMap = buildIdMap(countries)
  const idTexture = new THREE.DataTexture(idMap, ID_W, ID_H, THREE.RedFormat, THREE.UnsignedByteType)
  idTexture.minFilter = THREE.NearestFilter
  idTexture.magFilter = THREE.NearestFilter
  idTexture.generateMipmaps = false
  idTexture.unpackAlignment = 1
  idTexture.needsUpdate = true

  return {
    countries,
    idTexture,
    borders: ringsToSegments(countries.map((c) => c.feature)),
    indexAtUv(u, v) {
      const x = Math.min(ID_W - 1, Math.max(0, Math.floor(u * ID_W)))
      const y = Math.min(ID_H - 1, Math.max(0, Math.floor((1 - v) * ID_H)))
      return idMap[y * ID_W + x]
    },
  }
}

let promise: Promise<CountryData> | null = null
export function loadCountries() {
  promise ??= load()
  return promise
}
