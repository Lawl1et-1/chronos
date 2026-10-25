import { useEffect } from 'react'
import { Experience } from './scene/Experience'
import { useChronos } from './store/useChronos'
import { EraPanel } from './ui/EraPanel'
import { TitleScreen } from './ui/TitleScreen'
import { Hud } from './ui/Hud'
import { CountrySearch } from './ui/CountrySearch'
import { CountryTooltip } from './ui/CountryTooltip'
import { ZonePanel } from './ui/ZonePanel'
import { Loader } from './ui/Loader'

export default function App() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // let inputs handle their own Escape (clearing a search, etc.)
      if (e.target instanceof HTMLInputElement && e.target.type === 'search' && e.target.value) return
      useChronos.getState().back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="relative h-full w-full">
      <div className="absolute inset-0 z-0">
        <Experience />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10">
        <TitleScreen />
        <Hud />
        <CountrySearch />
        <ZonePanel />
        <EraPanel />
        <Loader />
      </div>
      <CountryTooltip />
    </main>
  )
}
