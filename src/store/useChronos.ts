import { create } from 'zustand'
import type { Country } from '../lib/countries'

export type Phase = 'intro' | 'globe' | 'zone'

interface ChronosState {
  phase: Phase
  countries: Country[]
  /** Country indices, 0 = none. */
  hovered: number
  selected: number
  setCountries: (countries: Country[]) => void
  enter: () => void
  hover: (index: number) => void
  select: (index: number) => void
  clearSelection: () => void
}

export const useChronos = create<ChronosState>((set, get) => ({
  phase: 'intro',
  countries: [],
  hovered: 0,
  selected: 0,
  setCountries: (countries) => set({ countries }),
  enter: () => set({ phase: 'globe' }),
  hover: (index) => {
    if (get().hovered !== index) set({ hovered: index })
  },
  select: (index) => set({ selected: index, phase: 'zone' }),
  clearSelection: () => set({ selected: 0, phase: 'globe' }),
}))

export const selectedCountry = (s: ChronosState) => (s.selected ? s.countries[s.selected - 1] : undefined)
export const hoveredCountry = (s: ChronosState) => (s.hovered ? s.countries[s.hovered - 1] : undefined)
