import { create } from 'zustand'
import type { Country } from '../lib/countries'
import type {
  Alteration,
  AlternatePartial,
  AlternateRequest,
  AlternateResponse,
  KeyEventsResponse,
  SharePayload,
} from '../../shared/schemas'
import { erasFor } from '../data/eras'
import { clampYear, formatYear } from '../lib/time'
import { ApiRequestError, STATIC_SITE, fetchKeyEvents, streamAlternateHistory } from '../api/client'
import { readGeminiKey, writeGeminiKey } from '../lib/geminiKey'

export type Phase = 'intro' | 'globe' | 'zone' | 'era' | 'events' | 'alternate'

export type KeyEventsState =
  | { status: 'idle' }
  | { status: 'loading'; key: string }
  | { status: 'ready'; key: string; data: KeyEventsResponse }
  | { status: 'error'; key: string; message: string }

/** One alternate timeline; sub-branches fork from a milestone of their parent. */
export interface Branch {
  /** "b1" for the root, "b1.2" for the second fork of b1, and so on. */
  id: string
  parentId: string | null
  /** Index of the parent milestone this branch forks from. */
  forkNode: number | null
  event: AlternateRequest['event']
  alteration: Alteration
  status: 'streaming' | 'ready' | 'error'
  partial: AlternatePartial | null
  data: AlternateResponse | null
  message: string | null
}

/** Deepest allowed fork (root = depth 0). */
export const MAX_DEPTH = 3

/** How long the chosen monolith takes to shatter before the camera pulls back. */
export const FRACTURE_MS = 1600

interface ChronosState {
  phase: Phase
  countries: Country[]
  /** Country indices, 0 = none. */
  hovered: number
  selected: number
  year: number
  keyEvents: KeyEventsState
  hoveredEvent: string | null
  selectedEvent: string | null
  alteration: Alteration | null
  fracturing: boolean
  branches: Branch[]
  activeBranch: string | null
  selectedNode: number | null
  comparing: boolean
  /** A shared timeline loaded from the URL, opened from the title screen. */
  pendingShare: SharePayload | null
  shareError: string | null
  /** Static site only: the visitor's own Gemini key (null = demo). */
  geminiKey: string | null
  keyDialogOpen: boolean
  setCountries: (countries: Country[]) => void
  enter: () => void
  hover: (index: number) => void
  select: (index: number) => void
  clearSelection: () => void
  openEra: () => void
  backToZone: () => void
  setYear: (year: number) => void
  explore: () => void
  loadKeyEvents: () => Promise<void>
  hoverEvent: (id: string | null) => void
  selectEvent: (id: string | null) => void
  setAlteration: (alteration: Alteration | null) => void
  rewrite: () => void
  forkBranch: (nodeIndex: number, alteration: Alteration) => void
  loadBranch: (id: string) => Promise<void>
  setActiveBranch: (id: string) => void
  selectNode: (index: number | null) => void
  setComparing: (on: boolean) => void
  setPendingShare: (share: SharePayload | null) => void
  setShareError: (message: string | null) => void
  setGeminiKey: (key: string | null) => void
  setKeyDialogOpen: (open: boolean) => void
  /** One step back through the flow (Escape). */
  back: () => void
}

let inFlight: AbortController | null = null
const branchControllers = new Map<string, AbortController>()

const findBranch = (branches: Branch[], id: string | null) => branches.find((b) => b.id === id)

export function branchDepth(branches: Branch[], branch: Branch) {
  let depth = 0
  for (let b = branch; b.parentId; depth++) b = findBranch(branches, b.parentId)!
  return depth
}

/** Root first: the chain of branches leading to (and including) this one. */
export function branchPath(branches: Branch[], branch: Branch) {
  const path = [branch]
  while (path[0].parentId) path.unshift(findBranch(branches, path[0].parentId)!)
  return path
}

export const branchContent = (b: Branch): AlternateResponse | AlternatePartial | null => b.data ?? b.partial

/** The alternate timelines a sub-branch grows from, cut at each fork. */
function historyFor(branches: Branch[], branch: Branch): AlternateRequest['history'] {
  const path = branchPath(branches, branch)
  return path.slice(0, -1).map((ancestor, i) => {
    const forkAt = path[i + 1].forkNode ?? 0
    return {
      alteration: ancestor.alteration.title,
      milestones: (ancestor.data?.timeline ?? [])
        .slice(0, forkAt + 1)
        .map((n) => ({ year: n.year, title: n.title.slice(0, 200) })),
    }
  })
}

export const useChronos = create<ChronosState>((set, get) => {
  const patchBranch = (id: string, patch: Partial<Branch>) =>
    set({ branches: get().branches.map((b) => (b.id === id ? { ...b, ...patch } : b)) })

  return {
    phase: 'intro',
    countries: [],
    hovered: 0,
    selected: 0,
    year: 1900,
    keyEvents: { status: 'idle' },
    hoveredEvent: null,
    selectedEvent: null,
    alteration: null,
    fracturing: false,
    branches: [],
    activeBranch: null,
    selectedNode: null,
    comparing: false,
    pendingShare: null,
    shareError: null,
    geminiKey: STATIC_SITE ? readGeminiKey() : null,
    keyDialogOpen: false,
    setCountries: (countries) => set({ countries }),
    enter: () => {
      const share = get().pendingShare
      if (!share) return set({ phase: 'globe' })
      // open a shared timeline directly
      const country =
        get().countries.find((c) => share.zone.iso && c.iso === share.zone.iso) ??
        get().countries.find((c) => c.name === share.zone.name)
      if (!country) return set({ phase: 'globe', pendingShare: null })
      set({
        pendingShare: null,
        selected: country.index,
        year: share.year,
        keyEvents: { status: 'ready', key: `${country.index}:${share.year}`, data: share.keyEvents },
        selectedEvent: share.selectedEvent,
        alteration: share.branches[0].alteration,
        branches: share.branches.map((b) => ({ ...b, status: 'ready', partial: null, message: null })),
        activeBranch: share.activeBranch,
        selectedNode: null,
        phase: 'alternate',
      })
    },
    hover: (index) => {
      if (get().hovered !== index) set({ hovered: index })
    },
    select: (index) => {
      const country = get().countries[index - 1]
      // start the spiral on the zone's first suggested era
      set({ selected: index, phase: 'zone', year: country ? erasFor(country)[0].focus : get().year })
    },
    clearSelection: () => set({ selected: 0, phase: 'globe', comparing: false }),
    openEra: () => set({ phase: 'era' }),
    backToZone: () => set({ phase: 'zone' }),
    setYear: (year) => set({ year: clampYear(year) }),
    explore: () => {
      set({ phase: 'events', hoveredEvent: null, selectedEvent: null })
      void get().loadKeyEvents()
    },
    loadKeyEvents: async () => {
      const { selected, countries, year, keyEvents } = get()
      const country = countries[selected - 1]
      if (!country) return
      const key = `${country.index}:${year}:${STATIC_SITE && !get().geminiKey ? 'demo' : 'live'}`
      if (keyEvents.status !== 'idle' && keyEvents.status !== 'error' && keyEvents.key === key) return

      inFlight?.abort()
      const controller = (inFlight = new AbortController())
      set({ keyEvents: { status: 'loading', key } })
      try {
        const data = await fetchKeyEvents(
          { zone: { name: country.name, iso: country.iso, lat: country.center[0], lon: country.center[1] }, year },
          controller.signal,
        )
        if (get().keyEvents.status === 'loading' && (get().keyEvents as { key: string }).key === key) {
          set({ keyEvents: { status: 'ready', key, data } })
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        const message = error instanceof ApiRequestError ? error.message : 'Une erreur inattendue est survenue.'
        set({ keyEvents: { status: 'error', key, message } })
      }
    },
    hoverEvent: (id) => {
      if (get().hoveredEvent !== id) set({ hoveredEvent: id })
    },
    selectEvent: (id) => set({ selectedEvent: id, alteration: null }),
    setAlteration: (alteration) => set({ alteration }),
    rewrite: () => {
      const { alteration, selectedEvent, fracturing, keyEvents } = get()
      if (!alteration || !selectedEvent || fracturing || keyEvents.status !== 'ready') return
      const event = keyEvents.data.events.find((e) => e.id === selectedEvent)
      if (!event) return
      // a new alteration of the event starts a new tree
      branchControllers.forEach((c) => c.abort())
      branchControllers.clear()
      const root: Branch = {
        id: 'b1',
        parentId: null,
        forkNode: null,
        event: { id: event.id, title: event.title, date: event.date, year: event.year, summary: event.summary },
        alteration,
        status: 'streaming',
        partial: null,
        data: null,
        message: null,
      }
      set({ fracturing: true, selectedNode: null, hoveredEvent: null, branches: [root], activeBranch: root.id })
      void get().loadBranch(root.id)
      setTimeout(() => set({ fracturing: false, phase: 'alternate' }), FRACTURE_MS)
    },
    forkBranch: (nodeIndex, alteration) => {
      const { branches, activeBranch } = get()
      const parent = findBranch(branches, activeBranch)
      const node = parent?.data?.timeline[nodeIndex]
      if (!parent || !node || branchDepth(branches, parent) >= MAX_DEPTH) return
      const siblings = branches.filter((b) => b.parentId === parent.id).length
      const child: Branch = {
        id: `${parent.id}.${siblings + 1}`,
        parentId: parent.id,
        forkNode: nodeIndex,
        event: {
          id: `${parent.id}-n${nodeIndex}`,
          title: node.title,
          date: formatYear(node.year),
          year: node.year,
          summary: node.description.slice(0, 800),
        },
        alteration,
        status: 'streaming',
        partial: null,
        data: null,
        message: null,
      }
      set({ branches: [...branches, child], activeBranch: child.id, selectedNode: null, comparing: false })
      void get().loadBranch(child.id)
    },
    loadBranch: async (id) => {
      const { keyEvents, branches } = get()
      const branch = findBranch(branches, id)
      if (!branch || keyEvents.status !== 'ready') return

      branchControllers.get(id)?.abort()
      const controller = new AbortController()
      branchControllers.set(id, controller)
      const current = () => branchControllers.get(id) === controller && !!findBranch(get().branches, id)
      patchBranch(id, { status: 'streaming', partial: null, message: null })
      try {
        const data = await streamAlternateHistory(
          {
            zone: keyEvents.data.zone,
            year: keyEvents.data.year,
            event: branch.event,
            alteration: branch.alteration,
            history: historyFor(get().branches, branch),
          },
          {
            signal: controller.signal,
            onPartial: (partial) => current() && patchBranch(id, { partial }),
            onReset: () => current() && patchBranch(id, { partial: null }),
          },
        )
        if (current()) patchBranch(id, { status: 'ready', data, partial: null })
      } catch (error) {
        if ((error as Error).name === 'AbortError' || !current()) return
        const message = error instanceof ApiRequestError ? error.message : 'Une erreur inattendue est survenue.'
        patchBranch(id, { status: 'error', message })
      } finally {
        if (branchControllers.get(id) === controller) branchControllers.delete(id)
      }
    },
    setActiveBranch: (id) => set({ activeBranch: id, selectedNode: null }),
    selectNode: (index) => set({ selectedNode: index }),
    setComparing: (on) => set({ comparing: on }),
    setPendingShare: (share) => set({ pendingShare: share, shareError: null }),
    setShareError: (message) => set({ shareError: message }),
    setGeminiKey: (key) => {
      writeGeminiKey(key)
      set({ geminiKey: key, keyDialogOpen: false })
      // demo events on screen: fetch the real ones now that a key is set
      const { keyEvents, phase } = get()
      if (key && keyEvents.status === 'ready' && keyEvents.data.demo) {
        set({ keyEvents: { status: 'idle' }, selectedEvent: null })
        if (phase === 'events') void get().loadKeyEvents()
      }
    },
    setKeyDialogOpen: (open) => set({ keyDialogOpen: open }),
    back: () => {
      const { phase, selectedEvent, selectedNode, fracturing, comparing, branches, activeBranch } = get()
      if (fracturing) return
      if (comparing) return set({ comparing: false })
      if (get().keyDialogOpen) return set({ keyDialogOpen: false })
      if (phase === 'alternate') {
        const branch = findBranch(branches, activeBranch)
        if (selectedNode !== null) set({ selectedNode: null })
        // from a sub-branch, go back to the milestone it forked from
        else if (branch?.parentId) set({ activeBranch: branch.parentId, selectedNode: branch.forkNode })
        else set({ phase: 'events' })
      } else if (phase === 'events') {
        if (selectedEvent) set({ selectedEvent: null })
        else set({ phase: 'era', hoveredEvent: null })
      } else if (phase === 'era') get().backToZone()
      else if (phase === 'zone') get().clearSelection()
    },
  }
})

export const selectedCountry = (s: ChronosState) => (s.selected ? s.countries[s.selected - 1] : undefined)
export const hoveredCountry = (s: ChronosState) => (s.hovered ? s.countries[s.hovered - 1] : undefined)
export const keyEventsData = (s: ChronosState) => (s.keyEvents.status === 'ready' ? s.keyEvents.data : null)
export const activeBranchOf = (s: ChronosState) => findBranch(s.branches, s.activeBranch) ?? null

/** "b1" → "Branche 1", "b1.2" → "Branche 1.2". */
export const branchLabel = (id: string) => `Branche ${id.slice(1)}`
