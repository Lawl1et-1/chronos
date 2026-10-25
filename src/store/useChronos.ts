import { create } from 'zustand'
import type { Country } from '../lib/countries'
import { erasFor } from '../data/eras'
import { clampYear } from '../lib/time'

export type Phase = 'intro' | 'globe' | 'zone' | 'era'

interface ChronosState {
  phase: Phase
  countries: Country[]
  /** Country indices, 0 = none. */
  hovered: number
  selected: number
  year: number
  setCountries: (countries: Country[]) => void
  enter: () => void
  hover: (index: number) => void
  select: (index: number) => void
  clearSelection: () => void
  openEra: () => void
  backToZone: () => void
  setYear: (year: number) => void
  /** One step back through the flow (Escape). */
  back: () => void
}

export const useChronos = create<ChronosState>((set, get) => ({
  phase: 'intro',
  countries: [],
  hovered: 0,
  selected: 0,
  year: 1900,
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
  back: () => {
    const { phase, backToZone, clearSelection } = get()
    if (phase === 'era') backToZone()
    else if (phase === 'zone') clearSelection()
  },
}))

export const selectedCountry = (s: ChronosState) => (s.selected ? s.countries[s.selected - 1] : undefined)
export const hoveredCountry = (s: ChronosState) => (s.hovered ? s.countries[s.hovered - 1] : undefined)
