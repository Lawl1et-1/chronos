import { create } from 'zustand'
import type { Country } from '../lib/countries'
import type { KeyEventsResponse } from '../../shared/schemas'
import { erasFor } from '../data/eras'
import { clampYear } from '../lib/time'
import { ApiRequestError, fetchKeyEvents } from '../api/client'

export type Phase = 'intro' | 'globe' | 'zone' | 'era' | 'events'

export type KeyEventsState =
  | { status: 'idle' }
  | { status: 'loading'; key: string }
  | { status: 'ready'; key: string; data: KeyEventsResponse }
  | { status: 'error'; key: string; message: string }

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
  /** One step back through the flow (Escape). */
  back: () => void
}

let inFlight: AbortController | null = null

export const useChronos = create<ChronosState>((set, get) => ({
  phase: 'intro',
  countries: [],
  hovered: 0,
  selected: 0,
  year: 1900,
  keyEvents: { status: 'idle' },
  hoveredEvent: null,
  selectedEvent: null,
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
  selectEvent: (id) => set({ selectedEvent: id }),
  back: () => {
    const { phase, selectedEvent, backToZone, clearSelection } = get()
    if (phase === 'events') {
      if (selectedEvent) set({ selectedEvent: null })
      else set({ phase: 'era', hoveredEvent: null })
    } else if (phase === 'era') backToZone()
    else if (phase === 'zone') clearSelection()
  },
}))

export const selectedCountry = (s: ChronosState) => (s.selected ? s.countries[s.selected - 1] : undefined)
export const hoveredCountry = (s: ChronosState) => (s.hovered ? s.countries[s.hovered - 1] : undefined)
export const keyEventsData = (s: ChronosState) => (s.keyEvents.status === 'ready' ? s.keyEvents.data : null)
