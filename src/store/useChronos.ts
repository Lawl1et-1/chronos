import { create } from 'zustand'
import type { Country } from '../lib/countries'
import type { Alteration, AlternatePartial, AlternateResponse, KeyEventsResponse } from '../../shared/schemas'
import { erasFor } from '../data/eras'
import { clampYear } from '../lib/time'
import { ApiRequestError, fetchKeyEvents, streamAlternateHistory } from '../api/client'

export type Phase = 'intro' | 'globe' | 'zone' | 'era' | 'events' | 'alternate'

export type KeyEventsState =
  | { status: 'idle' }
  | { status: 'loading'; key: string }
  | { status: 'ready'; key: string; data: KeyEventsResponse }
  | { status: 'error'; key: string; message: string }

export type AlternateState =
  | { status: 'idle' }
  | { status: 'streaming'; key: string; partial: AlternatePartial | null }
  | { status: 'ready'; key: string; data: AlternateResponse }
  | { status: 'error'; key: string; message: string; partial: AlternatePartial | null }

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
  alternate: AlternateState
  selectedNode: number | null
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
  loadAlternate: () => Promise<void>
  selectNode: (index: number | null) => void
  /** One step back through the flow (Escape). */
  back: () => void
}

let inFlight: AbortController | null = null
let alternateInFlight: AbortController | null = null

export const useChronos = create<ChronosState>((set, get) => ({
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
  alternate: { status: 'idle' },
  selectedNode: null,
  setCountries: (countries) => set({ countries }),
  enter: () => set({ phase: 'globe' }),
  hover: (index) => {
    if (get().hovered !== index) set({ hovered: index })
  },
  select: (index) => {
    const country = get().countries[index - 1]
    // start the spiral on the zone's first suggested era
    set({ selected: index, phase: 'zone', year: country ? erasFor(country)[0].focus : get().year })
  },
  clearSelection: () => set({ selected: 0, phase: 'globe' }),
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
    const key = `${country.index}:${year}`
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
    if (!get().alteration || !get().selectedEvent || get().fracturing) return
    set({ fracturing: true, selectedNode: null, hoveredEvent: null })
    void get().loadAlternate()
    setTimeout(() => set({ fracturing: false, phase: 'alternate' }), FRACTURE_MS)
  },
  loadAlternate: async () => {
    const { selected, countries, keyEvents, selectedEvent, alteration, alternate } = get()
    const country = countries[selected - 1]
    const event = keyEvents.status === 'ready' ? keyEvents.data.events.find((e) => e.id === selectedEvent) : null
    if (!country || !event || !alteration || keyEvents.status !== 'ready') return
    const key = [keyEvents.key, event.id, alteration.title, alteration.description].join('|')
    if (alternate.status !== 'idle' && alternate.status !== 'error' && alternate.key === key) return

    alternateInFlight?.abort()
    const controller = (alternateInFlight = new AbortController())
    const current = () => {
      const a = get().alternate
      return a.status === 'streaming' && a.key === key
    }
    set({ alternate: { status: 'streaming', key, partial: null } })
    try {
      const data = await streamAlternateHistory(
        {
          zone: keyEvents.data.zone,
          year: keyEvents.data.year,
          event: { id: event.id, title: event.title, date: event.date, year: event.year, summary: event.summary },
          alteration,
        },
        {
          signal: controller.signal,
          onPartial: (partial) => current() && set({ alternate: { status: 'streaming', key, partial } }),
          onReset: () => current() && set({ alternate: { status: 'streaming', key, partial: null } }),
        },
      )
      if (current()) set({ alternate: { status: 'ready', key, data } })
    } catch (error) {
      if ((error as Error).name === 'AbortError' || !current()) return
      const message = error instanceof ApiRequestError ? error.message : 'Une erreur inattendue est survenue.'
      const partial = (get().alternate as { partial: AlternatePartial | null }).partial
      set({ alternate: { status: 'error', key, message, partial } })
    }
  },
  selectNode: (index) => set({ selectedNode: index }),
  back: () => {
    const { phase, selectedEvent, selectedNode, fracturing, backToZone, clearSelection } = get()
    if (fracturing) return
    if (phase === 'alternate') {
      if (selectedNode !== null) set({ selectedNode: null })
      else set({ phase: 'events' })
    } else if (phase === 'events') {
      if (selectedEvent) set({ selectedEvent: null })
      else set({ phase: 'era', hoveredEvent: null })
    } else if (phase === 'era') backToZone()
    else if (phase === 'zone') clearSelection()
  },
}))

export const selectedCountry = (s: ChronosState) => (s.selected ? s.countries[s.selected - 1] : undefined)
export const hoveredCountry = (s: ChronosState) => (s.hovered ? s.countries[s.hovered - 1] : undefined)
export const keyEventsData = (s: ChronosState) => (s.keyEvents.status === 'ready' ? s.keyEvents.data : null)
