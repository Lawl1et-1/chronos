import { parse as parsePartial } from 'partial-json'
import { AlternateOutputSchema, TimelineNodeSchema, type AlternatePartial } from './schemas'

/**
 * Keeps only the parts of the half-written JSON that are complete: an item counts
 * as finished once the model has moved on to the next one (or the next field).
 */
export function completedParts(text: string): AlternatePartial | null {
  let raw: Record<string, unknown>
  try {
    raw = parsePartial(text) as Record<string, unknown>
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const finished = <T>(items: unknown, closed: boolean) =>
    Array.isArray(items) ? ((closed ? items : items.slice(0, -1)) as T[]) : []

  const divergence = AlternateOutputSchema.shape.divergencePoint.safeParse(raw.divergencePoint)
  const effects = finished<{ cause: string; effect: string }>(raw.butterflyEffects, 'timeline' in raw)
  const timeline = finished<unknown>(raw.timeline, 'worldIn2025' in raw)
    .map((n) => TimelineNodeSchema.safeParse(n))
    .filter((r) => r.success)
    .map((r) => r.data)
  return {
    divergencePoint: divergence.success && 'butterflyEffects' in raw ? divergence.data : undefined,
    butterflyEffects: effects.length ? effects : undefined,
    timeline,
  }
}

/** Short fingerprint of a partial result, to send updates only when something new is complete. */
export const partialSignature = (p: AlternatePartial) =>
  `${p.divergencePoint ? 1 : 0}|${p.butterflyEffects?.length ?? 0}|${p.timeline.length}`
