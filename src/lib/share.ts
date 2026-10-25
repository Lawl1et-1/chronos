import { SharePayloadSchema, type SharePayload } from '../../shared/schemas'
import { useChronos } from '../store/useChronos'

/** Snapshot of the finished branches of the current scenario, ready to be stored. */
export function buildSharePayload(): SharePayload | null {
  const { keyEvents, selectedEvent, branches, activeBranch } = useChronos.getState()
  if (keyEvents.status !== 'ready' || !selectedEvent) return null
  // only finished branches whose parents are finished too
  const done = new Set<string>()
  const ready = branches.filter((b) => {
    const ok = b.status === 'ready' && !!b.data && (!b.parentId || done.has(b.parentId))
    if (ok) done.add(b.id)
    return ok
  })
  if (!ready.length) return null
  const payload = {
    version: 1 as const,
    zone: keyEvents.data.zone,
    year: keyEvents.data.year,
    keyEvents: keyEvents.data,
    selectedEvent,
    branches: ready.map(({ id, parentId, forkNode, event, alteration, data }) => ({
      id,
      parentId,
      forkNode,
      event,
      alteration,
      data: data!,
    })),
    activeBranch: activeBranch && done.has(activeBranch) ? activeBranch : ready[0].id,
  }
  const checked = SharePayloadSchema.safeParse(payload)
  return checked.success ? checked.data : null
}

export const shareUrl = (id: string) => `${location.origin}${location.pathname}?s=${encodeURIComponent(id)}`

/** Id from the current URL (?s=…), if any. */
export function sharedIdFromUrl() {
  const id = new URLSearchParams(location.search).get('s')
  return id && /^[A-Za-z0-9_-]{6,32}$/.test(id) ? id : null
}
