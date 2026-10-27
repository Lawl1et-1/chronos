import type { AlternateResponse } from '../../shared/schemas'

/** Measurable footprint of a timeline, independent of the model's own score. */
export function timelineStats(data: AlternateResponse) {
  const countries = new Set(data.timeline.flatMap((n) => n.affectedRegions.map((r) => r.iso ?? r.name)))
  const last = data.timeline[data.timeline.length - 1]
  const confidence = data.timeline.reduce((sum, n) => sum + n.confidence, 0) / data.timeline.length
  return {
    countries: countries.size,
    years: Math.max(0, (last?.year ?? data.divergencePoint.year) - data.divergencePoint.year),
    confidence: Math.round(confidence * 100),
  }
}

/** Colour band of an impact score: low stays close to reality (blue), high breaks with it (red). */
export const impactTone = (score: number) => (score < 30 ? 'real' : score < 60 ? 'alt' : 'rupture')
